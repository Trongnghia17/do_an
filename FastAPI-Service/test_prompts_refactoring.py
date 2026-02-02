#!/usr/bin/env python3
"""
Test script để verify prompt refactoring
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.prompts import prompt_loader

def test_system_prompts():
    """Test lấy system prompts"""
    print("=" * 80)
    print("TEST 1: System Prompts")
    print("=" * 80)
    
    # Test generation system prompts
    for skill in ["reading", "listening", "writing", "speaking"]:
        prompt = prompt_loader.get_system_prompt("generation", "IELTS", skill)
        print(f"✅ Generation - IELTS {skill.capitalize()}: {len(prompt)} chars")
        assert len(prompt) > 0, f"System prompt for {skill} is empty"
    
    # Test grading system prompts
    for skill in ["writing", "speaking"]:
        prompt = prompt_loader.get_system_prompt("grading", "IELTS", skill)
        print(f"✅ Grading - IELTS {skill.capitalize()}: {len(prompt)} chars")
        assert len(prompt) > 0, f"Grading prompt for {skill} is empty"
    
    print()

def test_generation_prompts():
    """Test lấy generation prompts"""
    print("=" * 80)
    print("TEST 2: Generation Prompts")
    print("=" * 80)
    
    # Test Reading
    prompt = prompt_loader.get_generation_prompt(
        exam_type="IELTS",
        skill="reading",
        topic="Climate Change",
        difficulty="medium",
        num_questions=40,
        question_types=["multiple_choice", "true_false_not_given"]
    )
    print(f"✅ IELTS Reading: {len(prompt)} chars")
    assert "Climate Change" in prompt
    assert "40" in prompt
    
    # Test Listening
    prompt = prompt_loader.get_generation_prompt(
        exam_type="IELTS",
        skill="listening",
        topic="University Life",
        difficulty="hard",
        num_questions=40,
        question_types=["multiple_choice", "short_text"],
        part_number=1
    )
    print(f"✅ IELTS Listening: {len(prompt)} chars")
    assert "University Life" in prompt
    
    # Test Writing
    prompt = prompt_loader.get_generation_prompt(
        exam_type="IELTS",
        skill="writing",
        topic="Technology",
        difficulty="medium",
        num_questions=2
    )
    print(f"✅ IELTS Writing: {len(prompt)} chars")
    assert "Technology" in prompt
    
    # Test Speaking
    prompt = prompt_loader.get_generation_prompt(
        exam_type="IELTS",
        skill="speaking",
        topic="Travel",
        difficulty="medium",
        num_questions=10
    )
    print(f"✅ IELTS Speaking: {len(prompt)} chars")
    assert "Travel" in prompt
    
    print()

def test_grading_prompts():
    """Test lấy grading prompts"""
    print("=" * 80)
    print("TEST 3: Grading Prompts")
    print("=" * 80)
    
    # Test Writing grading
    prompt = prompt_loader.get_grading_prompt(
        exam_type="IELTS",
        skill="writing",
        question="Describe the chart showing population growth",
        answer="The chart shows that population increased from 1990 to 2020..."
    )
    print(f"✅ IELTS Writing Grading: {len(prompt)} chars")
    assert "population" in prompt.lower()
    assert "Band" in prompt
    
    # Test Speaking grading
    prompt = prompt_loader.get_grading_prompt(
        exam_type="IELTS",
        skill="speaking",
        question="Talk about your hometown",
        answer="My hometown is a small city in the north of Vietnam..."
    )
    print(f"✅ IELTS Speaking Grading: {len(prompt)} chars")
    assert "hometown" in prompt.lower()
    assert "Band" in prompt
    
    print()

def test_feedback_prompt():
    """Test feedback prompt"""
    print("=" * 80)
    print("TEST 4: Feedback Prompt")
    print("=" * 80)
    
    prompt = prompt_loader.get_feedback_prompt(
        question="What is the capital of France?",
        user_answer="London",
        correct_answer="Paris",
        skill="reading"
    )
    print(f"✅ Feedback Prompt: {len(prompt)} chars")
    assert "Paris" in prompt
    assert "London" in prompt
    
    print()

def test_band_descriptors():
    """Test Band Descriptors"""
    print("=" * 80)
    print("TEST 5: Band Descriptors")
    print("=" * 80)
    
    from app.services.prompts.grading import ielts_writing_grading, ielts_speaking_grading
    
    # Test Writing Band Descriptors
    writing_descriptors = ielts_writing_grading.get_ielts_writing_band_descriptors()
    print(f"✅ Writing Band Descriptors: {len(writing_descriptors)} criteria")
    assert "task_achievement_task1" in writing_descriptors
    assert "task_response_task2" in writing_descriptors
    assert "coherence_cohesion" in writing_descriptors
    assert "lexical_resource" in writing_descriptors
    assert "grammatical_accuracy" in writing_descriptors
    
    # Test Speaking Band Descriptors
    speaking_descriptors = ielts_speaking_grading.get_ielts_speaking_band_descriptors()
    print(f"✅ Speaking Band Descriptors: {len(speaking_descriptors)} criteria")
    assert "fluency_coherence" in speaking_descriptors
    assert "lexical_resource" in speaking_descriptors
    assert "grammatical_accuracy" in speaking_descriptors
    assert "pronunciation" in speaking_descriptors
    
    print()

def main():
    """Run all tests"""
    print("\n" + "=" * 80)
    print("PROMPT REFACTORING VERIFICATION TEST")
    print("=" * 80 + "\n")
    
    try:
        test_system_prompts()
        test_generation_prompts()
        test_grading_prompts()
        test_feedback_prompt()
        test_band_descriptors()
        
        print("=" * 80)
        print("✅ ALL TESTS PASSED!")
        print("=" * 80)
        print("\n✨ Prompt refactoring hoàn tất thành công!")
        print("📁 Cấu trúc mới:")
        print("   - app/services/prompts/generation/ (4 files)")
        print("   - app/services/prompts/grading/ (2 files)")
        print("   - app/services/prompts/prompt_loader.py")
        print("   - app/services/chatgpt_service.py (sạch sẽ, 600 dòng)")
        print("\n📚 Xem README.md trong thư mục prompts/ để biết thêm chi tiết")
        print()
        
        return 0
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
