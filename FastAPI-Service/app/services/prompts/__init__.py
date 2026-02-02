"""
Prompt templates for AI question generation and grading

This module organizes all AI prompts in a structured way:
- generation/: Prompts for generating exam questions
- grading/: Prompts for grading student answers
- templates/: Reusable prompt templates

Usage:
    from app.services.prompts import prompt_loader
    
    # Get generation prompt
    prompt = prompt_loader.get_generation_prompt(
        exam_type="IELTS",
        skill="reading", 
        topic="Climate Change",
        difficulty="medium",
        num_questions=40
    )
    
    # Get grading prompt
    grading = prompt_loader.get_grading_prompt(
        exam_type="IELTS",
        skill="writing",
        question="...",
        answer="..."
    )
"""
from .prompt_loader import PromptLoader, prompt_loader

__all__ = ['PromptLoader', 'prompt_loader']
