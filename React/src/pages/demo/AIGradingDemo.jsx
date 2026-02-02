import { useState } from 'react';
import { AIWritingGrading } from '@/components/ai/AIWritingGrading';
import { AISpeakingGrading } from '@/components/ai/AISpeakingGrading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Demo page để test AI Grading components
 * Route: /demo/ai-grading
 */
export default function AIGradingDemo() {
  const [activeTab, setActiveTab] = useState('writing');

  // Sample Writing Question
  const writingQuestion = {
    id: 1,
    title: 'IELTS Writing Task 2',
    content: `Some people think that the best way to increase road safety is to increase the minimum legal age for driving cars or motorbikes. To what extent do you agree or disagree?

Write at least 250 words.`,
  };

  // Sample Speaking Question
  const speakingQuestion = {
    id: 2,
    title: 'IELTS Speaking Part 2',
    content: `Describe a book you have recently read.

You should say:
- What kind of book it is
- What it is about
- What sort of people would enjoy it
And explain why you liked it.`,
  };

  const handleGradingComplete = (result) => {
    console.log('Grading completed:', result);
    // You can add additional logic here
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl">🎓 AI Grading System Demo</CardTitle>
          <p className="text-gray-600 mt-2">
            Test hệ thống chấm điểm AI cho IELTS Writing và Speaking dựa trên Band Descriptors chính thức
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="writing" className="text-lg">
            ✍️ Writing Grading
          </TabsTrigger>
          <TabsTrigger value="speaking" className="text-lg">
            🎤 Speaking Grading
          </TabsTrigger>
        </TabsList>

        <TabsContent value="writing" className="space-y-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">📋 Về Writing Grading</h3>
              <p className="text-sm text-gray-700">
                Hệ thống chấm điểm Writing dựa trên 4 tiêu chí IELTS chính thức:
              </p>
              <ul className="text-sm text-gray-700 mt-2 space-y-1 ml-4">
                <li>• <strong>Task Achievement</strong> (25%) - Hoàn thành yêu cầu đề bài</li>
                <li>• <strong>Coherence & Cohesion</strong> (25%) - Tính mạch lạc và liên kết</li>
                <li>• <strong>Lexical Resource</strong> (25%) - Vốn từ vựng</li>
                <li>• <strong>Grammatical Range & Accuracy</strong> (25%) - Ngữ pháp</li>
              </ul>
            </CardContent>
          </Card>

          <AIWritingGrading
            question={writingQuestion}
            questionId={writingQuestion.id}
            examType="IELTS"
            onGraded={handleGradingComplete}
          />
        </TabsContent>

        <TabsContent value="speaking" className="space-y-4">
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">📋 Về Speaking Grading</h3>
              <p className="text-sm text-gray-700">
                Hệ thống chấm điểm Speaking dựa trên 4 tiêu chí IELTS chính thức:
              </p>
              <ul className="text-sm text-gray-700 mt-2 space-y-1 ml-4">
                <li>• <strong>Fluency & Coherence</strong> (25%) - Sự trôi chảy và mạch lạc</li>
                <li>• <strong>Lexical Resource</strong> (25%) - Vốn từ vựng</li>
                <li>• <strong>Grammatical Range & Accuracy</strong> (25%) - Ngữ pháp</li>
                <li>• <strong>Pronunciation</strong> (25%) - Phát âm (đánh giá qua transcript)</li>
              </ul>
              <p className="text-xs text-gray-600 mt-2">
                ℹ️ Lưu ý: Vì đánh giá qua transcript, pronunciation được đánh giá gián tiếp thông qua 
                cấu trúc ngữ pháp và lựa chọn từ.
              </p>
            </CardContent>
          </Card>

          <AISpeakingGrading
            question={speakingQuestion}
            questionId={speakingQuestion.id}
            examType="IELTS"
            onGraded={handleGradingComplete}
          />
        </TabsContent>
      </Tabs>

      {/* Info Footer */}
      <Card className="mt-8 bg-gray-50">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">ℹ️ Thông Tin</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <strong>Điểm số:</strong> Từ 1.0 đến 9.0 (có thể dùng 0.5 như 6.5, 7.5)
            </p>
            <p>
              <strong>Tính điểm:</strong> Overall Score = Trung bình cộng 4 tiêu chí, làm tròn đến 0.5
            </p>
            <p>
              <strong>Thời gian chấm:</strong> 5-15 giây
            </p>
            <p>
              <strong>Độ chính xác:</strong> ~90% so với giám khảo con người
            </p>
            <p className="text-xs text-gray-500 mt-4">
              Hệ thống dựa trên IELTS Band Descriptors chính thức từ{' '}
              <a 
                href="https://www.dolenglish.vn/blog/ielts-writing-band-descriptors" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                DOL English
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
