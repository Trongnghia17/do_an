"""
Question Generation Prompts
Organized by exam type and skill
"""

from . import ielts_reading
from . import ielts_listening
from . import ielts_writing
from . import ielts_speaking

__all__ = [
    'ielts_reading',
    'ielts_listening', 
    'ielts_writing',
    'ielts_speaking'
]
