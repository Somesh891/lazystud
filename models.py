from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String)  # "student" or "writer"


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    subject = Column(String)
    budget = Column(Float)
    deadline = Column(String)  # e.g. "2025-12-01"
    status = Column(String, default="open")  # "open", "accepted", "completed"

    student_id = Column(Integer, ForeignKey("users.id"))
    writer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    submission_text = Column(String, nullable=True)

