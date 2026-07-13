from fastapi import APIRouter, HTTPException, Depends, Request
from models.expense import Expense, ExpenseCreate
from db import get_supabase
from services.auth import get_current_user
from typing import List

router = APIRouter()

@router.post("/", response_model=None)
def add_expense(expense: ExpenseCreate, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    data = {
        "description": expense.description,
        "amount": expense.amount,
        "category": expense.category,
        "user_id": user_id  # Enforce authenticated user_id
    }
    
    result = supabase.table("expenses").insert(data).execute()
    return result.data[0] if result.data else {"message": "Success"}

@router.get("/", response_model=List[Expense])
def get_expenses(user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    # Filter by authenticated user_id
    result = supabase.table("expenses").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
    return result.data

@router.delete("/{expense_id}")
def delete_expense(expense_id: int, user_id: str = Depends(get_current_user)):
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=500, detail="Database connection failed")
    
    # Verify ownership before deleting
    result = supabase.table("expenses").delete().eq("id", expense_id).eq("user_id", user_id).execute()
    return {"message": "Expense deleted"}
