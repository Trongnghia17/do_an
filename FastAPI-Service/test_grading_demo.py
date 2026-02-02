"""
Demo/Test Script cho AI Grading System
Chấm điểm Writing và Speaking theo IELTS Band Descriptors
"""

import asyncio
import json
from app.services.chatgpt_service import chatgpt_service


async def test_writing_grading():
    """Test chấm điểm Writing"""
    print("=" * 80)
    print("🔍 TEST WRITING GRADING - IELTS Task 2")
    print("=" * 80)
    
    question = """
Some people think that the best way to increase road safety is to increase the minimum legal age for driving cars or motorbikes. To what extent do you agree or disagree?
"""
    
    answer = """
Road safety has become a major concern in many countries. While some people argue that raising the minimum legal driving age would improve road safety, I believe this solution would have limited effectiveness and there are better alternatives.

Firstly, increasing the legal driving age may not address the root causes of road accidents. Research shows that inexperience, not age, is the primary factor in accidents. A 25-year-old first-time driver is just as likely to have an accident as an 18-year-old novice. Therefore, the focus should be on improving driver education and training programs rather than simply raising the age limit.

Moreover, there are more effective measures to enhance road safety. Stricter enforcement of traffic laws, such as penalties for speeding and drunk driving, has proven successful in many countries. Additionally, investing in better road infrastructure and installing more traffic cameras can significantly reduce accident rates. For example, Singapore has one of the world's lowest accident rates due to its comprehensive approach to road safety, which includes education, enforcement, and infrastructure.

However, I acknowledge that young drivers do have higher accident rates, partly due to reckless behavior and peer pressure. Nevertheless, this can be addressed through graduated licensing systems that gradually introduce young drivers to more challenging driving conditions, rather than preventing them from driving altogether.

In conclusion, while raising the minimum driving age may seem like a simple solution, I believe that improving driver education and implementing stricter enforcement measures would be more effective in reducing road accidents.
"""
    
    print(f"📝 Question:\n{question}\n")
    print(f"✍️ Student's Answer (Word count: {len(answer.split())} words):\n{answer[:200]}...\n")
    print("⏳ Grading in progress...\n")
    
    try:
        result = await chatgpt_service.grade_writing_answer(
            question=question,
            answer=answer,
            exam_type="IELTS",
            criteria=None
        )
        
        print("=" * 80)
        print("📊 GRADING RESULT")
        print("=" * 80)
        print(f"\n🎯 Overall Score: {result.get('overall_score', 0)}/9.0\n")
        
        print("📋 Criteria Scores:")
        for criterion, score in result.get('criteria_scores', {}).items():
            print(f"  • {criterion}: {score}/9.0")
        
        print("\n" + "=" * 80)
        print("💬 DETAILED FEEDBACK BY CRITERIA")
        print("=" * 80)
        for criterion, feedback in result.get('criteria_feedback', {}).items():
            print(f"\n{criterion.upper().replace('_', ' ')}:")
            print(f"{feedback}\n")
        
        print("=" * 80)
        print("✅ STRENGTHS")
        print("=" * 80)
        for i, strength in enumerate(result.get('strengths', []), 1):
            print(f"{i}. {strength}")
        
        print("\n" + "=" * 80)
        print("⚠️ WEAKNESSES")
        print("=" * 80)
        for i, weakness in enumerate(result.get('weaknesses', []), 1):
            print(f"{i}. {weakness}")
        
        print("\n" + "=" * 80)
        print("💡 SUGGESTIONS FOR IMPROVEMENT")
        print("=" * 80)
        for i, suggestion in enumerate(result.get('suggestions', []), 1):
            print(f"{i}. {suggestion}")
        
        print("\n" + "=" * 80)
        print("📖 OVERALL FEEDBACK")
        print("=" * 80)
        print(result.get('detailed_feedback', ''))
        
        print("\n" + "=" * 80)
        print("🎓 BAND JUSTIFICATION")
        print("=" * 80)
        print(result.get('band_justification', ''))
        
        print("\n" + "=" * 80)
        print("✅ Writing grading test completed successfully!")
        print("=" * 80)
        
        return result
        
    except Exception as e:
        print(f"❌ Error during grading: {str(e)}")
        raise


async def test_speaking_grading():
    """Test chấm điểm Speaking"""
    print("\n\n")
    print("=" * 80)
    print("🔍 TEST SPEAKING GRADING - IELTS Part 2")
    print("=" * 80)
    
    question = """
Describe a book you have recently read.

You should say:
- What kind of book it is
- What it is about
- What sort of people would enjoy it
And explain why you liked it.
"""
    
    transcript = """
Well, I'd like to talk about a book I recently finished reading called "Sapiens" by Yuval Noah Harari. It's a non-fiction book, specifically a history book, but it's written in a very engaging way that makes it accessible to general readers.

The book is basically about the history of humankind, from the evolution of Homo sapiens in Africa to the present day. What makes it fascinating is that it covers not just historical events, but also explores how humans developed cognitive abilities, created religions, built empires, and shaped the modern world. The author presents interesting perspectives on topics like the agricultural revolution, the role of money, and the impact of scientific discoveries.

I think this book would appeal to people who are curious about history and anthropology, but also to those interested in philosophy and understanding the human condition. It's written in clear language, so you don't need to be an expert to understand it. However, it does require some concentration because the ideas are quite profound.

Personally, I really enjoyed this book for several reasons. First, it changed my perspective on many things I took for granted, like the importance of shared beliefs in human society. Second, the author's writing style is engaging and often humorous, which makes complex topics easier to digest. Finally, it made me think more critically about the future of humanity and the choices we're making today. Overall, it's one of those books that stays with you long after you've finished reading it.
"""
    
    print(f"📝 Question:\n{question}\n")
    print(f"🎤 Student's Response (Word count: {len(transcript.split())} words):\n{transcript[:200]}...\n")
    print("⏳ Grading in progress...\n")
    
    try:
        result = await chatgpt_service.grade_speaking_answer(
            question=question,
            transcript=transcript,
            exam_type="IELTS",
            criteria=None
        )
        
        print("=" * 80)
        print("📊 GRADING RESULT")
        print("=" * 80)
        print(f"\n🎯 Overall Score: {result.get('overall_score', 0)}/9.0\n")
        
        print("📋 Criteria Scores:")
        for criterion, score in result.get('criteria_scores', {}).items():
            print(f"  • {criterion}: {score}/9.0")
        
        print("\n" + "=" * 80)
        print("💬 DETAILED FEEDBACK BY CRITERIA")
        print("=" * 80)
        for criterion, feedback in result.get('criteria_feedback', {}).items():
            print(f"\n{criterion.upper().replace('_', ' ')}:")
            print(f"{feedback}\n")
        
        print("=" * 80)
        print("✅ STRENGTHS")
        print("=" * 80)
        for i, strength in enumerate(result.get('strengths', []), 1):
            print(f"{i}. {strength}")
        
        print("\n" + "=" * 80)
        print("⚠️ WEAKNESSES")
        print("=" * 80)
        for i, weakness in enumerate(result.get('weaknesses', []), 1):
            print(f"{i}. {weakness}")
        
        print("\n" + "=" * 80)
        print("💡 SUGGESTIONS FOR IMPROVEMENT")
        print("=" * 80)
        for i, suggestion in enumerate(result.get('suggestions', []), 1):
            print(f"{i}. {suggestion}")
        
        print("\n" + "=" * 80)
        print("📖 OVERALL FEEDBACK")
        print("=" * 80)
        print(result.get('detailed_feedback', ''))
        
        print("\n" + "=" * 80)
        print("🎓 BAND JUSTIFICATION")
        print("=" * 80)
        print(result.get('band_justification', ''))
        
        if result.get('pronunciation_note'):
            print("\n" + "=" * 80)
            print("🔊 PRONUNCIATION NOTE")
            print("=" * 80)
            print(result.get('pronunciation_note', ''))
        
        print("\n" + "=" * 80)
        print("✅ Speaking grading test completed successfully!")
        print("=" * 80)
        
        return result
        
    except Exception as e:
        print(f"❌ Error during grading: {str(e)}")
        raise


async def run_all_tests():
    """Chạy tất cả tests"""
    print("\n")
    print("🚀 " + "=" * 76 + " 🚀")
    print("🚀" + " " * 76 + "🚀")
    print("🚀" + " " * 20 + "AI GRADING SYSTEM - DEMO & TEST" + " " * 24 + "🚀")
    print("🚀" + " " * 15 + "IELTS Writing & Speaking Band Descriptors" + " " * 20 + "🚀")
    print("🚀" + " " * 76 + "🚀")
    print("🚀 " + "=" * 76 + " 🚀")
    print("\n")
    
    # Test Writing
    writing_result = await test_writing_grading()
    
    # Test Speaking
    speaking_result = await test_speaking_grading()
    
    # Summary
    print("\n\n")
    print("=" * 80)
    print("📊 TEST SUMMARY")
    print("=" * 80)
    print(f"✅ Writing Test: Overall Score = {writing_result.get('overall_score', 0)}/9.0")
    print(f"✅ Speaking Test: Overall Score = {speaking_result.get('overall_score', 0)}/9.0")
    print("=" * 80)
    print("🎉 All tests completed successfully!")
    print("=" * 80)


if __name__ == "__main__":
    # Chạy tests
    asyncio.run(run_all_tests())
