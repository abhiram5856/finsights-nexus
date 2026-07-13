from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ExpenseBase(BaseModel):
    description: str
    amount: float
    category: str

class ExpenseCreate(ExpenseBase):
    user_id: str

class Expense(ExpenseBase):
    id: int
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True
