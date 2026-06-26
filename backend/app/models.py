from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user") # user, admin
    country = Column(String, nullable=False) # UK, India, UAE, Canada, Germany
    status = Column(String, default="Active") # Active, Suspended
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    total_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0)
    interest_rate = Column(Float, default=1.5) # flat emergency rate %
    status = Column(String, default="Active") # Active, Paid
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class P2PMatch(Base):
    __tablename__ = "p2p_matches"

    id = Column(Integer, primary_key=True, index=True)
    match_code = Column(String, unique=True, index=True, nullable=False) # e.g. SZB-8902
    from_user = Column(String, nullable=False)
    to_user = Column(String, nullable=False)
    from_country = Column(String, nullable=False)
    to_country = Column(String, nullable=False)
    amount_from = Column(String, nullable=False) # e.g. £100
    amount_to = Column(String, nullable=False)   # e.g. ₹13,150
    status = Column(String, default="Settled Locally")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class GuarantorNode(Base):
    __tablename__ = "guarantor_nodes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    guarantor_name = Column(String, nullable=False)
    relation = Column(String, nullable=False)
    country = Column(String, nullable=False)
    score_contribution = Column(String, nullable=False) # e.g. +35%
    status = Column(String, default="Active") # Active, Pending

class TransactionLog(Base):
    __tablename__ = "transaction_logs"

    id = Column(Integer, primary_key=True, index=True)
    tx_id = Column(String, unique=True, index=True, nullable=False)
    user_name = Column(String, nullable=False)
    operation_type = Column(String, nullable=False) # Payout, Repay, Rate Lock
    amount_gbp = Column(Float, nullable=False)
    status = Column(String, default="Success")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
