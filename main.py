from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy.exc import IntegrityError

from database import Base, engine, SessionLocal
from models import User, Assignment

# ------------------------------
# DB: create tables
# ------------------------------
Base.metadata.create_all(bind=engine)

# ------------------------------
# Pydantic Schemas
# ------------------------------
class AssignmentCreate(BaseModel):
    title: str
    description: str
    subject: str
    budget: float
    deadline: str  # e.g. "2025-12-05"


class AssignmentOut(BaseModel):
    id: int
    title: str
    description: str
    subject: str
    budget: float
    deadline: str
    status: str
    student_id: int
    writer_id: Optional[int] = None
    submission_text: Optional[str] = None

    class Config:
        from_attributes = True  # for Pydantic v2


class UserSchema(BaseModel):
    username: str
    email: str
    password: str
    role: str  # "student" or "writer"


class LoginSchema(BaseModel):
    email: str
    password: str


class SubmissionSchema(BaseModel):
    text: str


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    budget: Optional[float] = None
    deadline: Optional[str] = None


# ------------------------------
# Auth / JWT Config
# ------------------------------
SECRET_KEY = "supersecretkey_change_this_later"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ------------------------------
# FastAPI App Setup
# ------------------------------
app = FastAPI(title="LazyStud API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://lazystud.vercel.app",
        "https://lazystud-dd3jywub1-somesh891s-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------
# DB Session Dependency
# ------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ------------------------------
# Helper: get current user from Bearer token
# ------------------------------
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    token = credentials.credentials

    credentials_exception = HTTPException(
        status_code=401,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: Optional[str] = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception

    return user


# ------------------------------
# Routes
# ------------------------------
@app.get("/")
def home():
    return {"message": "Welcome to LazyStud API 🚀"}


# -------- USER ROUTES --------
@app.post("/signup")
def signup(user: UserSchema, db: Session = Depends(get_db)):
    # Check email
    exists_email = db.query(User).filter(User.email == user.email).first()
    if exists_email:
        raise HTTPException(status_code=400, detail="Email already exists")

    # Check username
    exists_username = db.query(User).filter(User.username == user.username).first()
    if exists_username:
        raise HTTPException(status_code=400, detail="Username already exists")

    # bcrypt 72‑byte limit
    password = user.password.encode("utf-8")[:72]
    hashed_pw = pwd_context.hash(password)

@app.post("/login")
def login(data: LoginSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()

    if not user or not pwd_context.verify(data.password, user.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    token = create_access_token({"sub": user.email})

    return {
        "message": "Login successful!",
        "access_token": token,
        "token_type": "bearer",
        "user": user.username,
        "role": user.role,
    }


@app.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
    }


# -------- ASSIGNMENT ROUTES --------
@app.post("/assignments", response_model=AssignmentOut)
def create_assignment(
    assignment: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can post assignments")

    new_assignment = Assignment(
        title=assignment.title,
        description=assignment.description,
        subject=assignment.subject,
        budget=assignment.budget,
        deadline=assignment.deadline,
        status="open",
        student_id=current_user.id,
    )

    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    return new_assignment


@app.get("/assignments", response_model=List[AssignmentOut])
def list_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Any logged‑in user can see open assignments
    assignments = db.query(Assignment).filter(Assignment.status == "open").all()
    return assignments


@app.post("/assignments/{assignment_id}/accept", response_model=AssignmentOut)
def accept_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "writer":
        raise HTTPException(status_code=403, detail="Only writers can accept assignments")

    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if assignment.status != "open":
        raise HTTPException(status_code=400, detail="Assignment already taken")

    assignment.status = "accepted"
    assignment.writer_id = current_user.id

    db.commit()
    db.refresh(assignment)
    return assignment


@app.get("/my-work", response_model=List[AssignmentOut])
def my_work(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "writer":
        raise HTTPException(status_code=403, detail="Only writers can see their work")

    assignments = db.query(Assignment).filter(
        Assignment.writer_id == current_user.id
    ).all()
    return assignments


@app.post("/assignments/{assignment_id}/complete", response_model=AssignmentOut)
def complete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "writer":
        raise HTTPException(status_code=403, detail="Only writers can complete assignments")

    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if assignment.writer_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="This assignment is not assigned to you"
        )

    if assignment.status != "accepted":
        raise HTTPException(
            status_code=400, detail="Only accepted assignments can be completed"
        )

    assignment.status = "completed"
    db.commit()
    db.refresh(assignment)
    return assignment


@app.get("/my-assignments", response_model=List[AssignmentOut])
def my_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can see their assignments")

    assignments = (
        db.query(Assignment)
        .filter(Assignment.student_id == current_user.id)
        .all()
    )
    return assignments


@app.post("/assignments/{assignment_id}/cancel", response_model=AssignmentOut)
def cancel_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only students can cancel
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can cancel assignments")

    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Must be the owner
    if assignment.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="This assignment is not yours")

    # Only open assignments can be cancelled
    if assignment.status != "open":
        raise HTTPException(
            status_code=400, detail="Only open assignments can be cancelled"
        )

    assignment.status = "cancelled"
    db.commit()
    db.refresh(assignment)
    return assignment


@app.put("/assignments/{assignment_id}", response_model=AssignmentOut)
def update_assignment(
    assignment_id: int,
    update: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Only students can edit
    if current_user.role != "student":
        raise HTTPException(status_code=403, detail="Only students can edit assignments")

    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Must be the owner
    if assignment.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="This assignment is not yours")

    # Only open assignments can be edited
    if assignment.status != "open":
        raise HTTPException(
            status_code=400, detail="Only open assignments can be edited"
        )

    if update.title is not None:
        assignment.title = update.title
    if update.description is not None:
        assignment.description = update.description
    if update.subject is not None:
        assignment.subject = update.subject
    if update.budget is not None:
        assignment.budget = update.budget
    if update.deadline is not None:
        assignment.deadline = update.deadline

    db.commit()
    db.refresh(assignment)
    return assignment


@app.post("/assignments/{assignment_id}/submit", response_model=AssignmentOut)
def submit_assignment(
    assignment_id: int,
    submission: SubmissionSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "writer":
        raise HTTPException(status_code=403, detail="Only writers can submit assignments")

    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    if assignment.writer_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="This assignment is not assigned to you"
        )

    if assignment.status != "accepted":
        raise HTTPException(
            status_code=400, detail="Only accepted assignments can be submitted"
        )

    assignment.submission_text = submission.text
    assignment.status = "completed"

    db.commit()
    db.refresh(assignment)
    return assignment
