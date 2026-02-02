import { useState } from 'react';
import { useAIGrading } from '@/hooks/useAIGrading';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Mic, Info } from 'lucide-react';

/**
 * Component for AI-powered Speaking grading
 * Có thể tái sử dụng trong existing exam flow
 */
export const AISpeakingGrading = ({ question, questionId, examType = 'IELTS', onGraded }) => {
  const [transcript, setTranscript] = useState('');
  const { gradeSpeaking, loading, error, result } = useAIGrading();

  const handleSubmit = async () => {
    try {
      const gradingResult = await gradeSpeaking(
        questionId,
        question.content || question.question_text,
        transcript,
        examType
      );
      
      if (onGraded) {
        onGraded(gradingResult);
      }
    } catch (err) {
      console.error('Grading error:', err);
    }
  };

  const wordCount = transcript.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            {question.title || 'Speaking Task'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose max-w-none">
            <p className="font-medium">{question.content || question.question_text}</p>
          </div>

          {/* Note about transcript */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Nhập hoặc dán transcript (văn bản) của câu trả lời Speaking. 
              Hệ thống AI sẽ đánh giá dựa trên nội dung văn bản.
            </AlertDescription>
          </Alert>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Transcript của câu trả lời</label>
              <span className="text-sm text-gray-500">Words: {wordCount}</span>
            </div>
            <Textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste or type the transcript of your speaking response here...

Example:
Well, I'd like to talk about a place I recently visited. It was a beautiful beach in Da Nang..."
              rows={12}
              className="w-full font-mono text-sm"
              disabled={loading || result}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!result && (
            <Button
              onClick={handleSubmit}
              disabled={loading || !transcript.trim() || wordCount < 20}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'AI đang chấm điểm...' : 'Chấm Điểm Speaking'}
            </Button>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Kết Quả Chấm Điểm Speaking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Score */}
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <div className="text-5xl font-bold text-blue-600">
                {result.overall_score.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 mt-2">IELTS Band Score (out of 9.0)</div>
            </div>

            {/* Criteria Scores with Feedback */}
            {result.criteria_scores && Object.keys(result.criteria_scores).length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold mb-3">📊 Chi Tiết Điểm Theo Tiêu Chí (IELTS Band Descriptors)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(result.criteria_scores).map(([criterion, score]) => (
                    <div key={criterion} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium capitalize">
                          {criterion.replace(/_/g, ' ')}
                        </span>
                        <span className="font-bold text-lg text-blue-600">
                          {typeof score === 'number' ? score.toFixed(1) : score}/9.0
                        </span>
                      </div>
                      {/* Criteria Feedback */}
                      {result.criteria_feedback && result.criteria_feedback[criterion] && (
                        <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                          {result.criteria_feedback[criterion]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pronunciation Note - UNIQUE FOR SPEAKING */}
            {result.pronunciation_note && (
              <Alert className="bg-amber-50 border-amber-200">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>🔊 Lưu ý về Pronunciation:</strong>
                  <br />
                  {result.pronunciation_note}
                </AlertDescription>
              </Alert>
            )}

            {/* Strengths */}
            {result.strengths && result.strengths.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  ✅ Điểm Mạnh
                </h4>
                <ul className="space-y-2">
                  {result.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas for Improvement */}
            {result.weaknesses && result.weaknesses.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-orange-700">
                  <XCircle className="h-4 w-4" />
                  ⚠️ Điểm Cần Cải Thiện
                </h4>
                <ul className="space-y-2">
                  {result.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex gap-2">
                      <span className="text-orange-600 font-bold">•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Detailed Feedback */}
            {result.detailed_feedback && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold mb-2">📖 Nhận Xét Tổng Quan</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {result.detailed_feedback}
                </p>
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="font-semibold mb-2">💡 Gợi Ý Cải Thiện</h4>
                <ul className="space-y-2">
                  {result.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex gap-2">
                      <span className="font-semibold text-blue-600">{idx + 1}.</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Band Justification */}
            {result.band_justification && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 shadow-sm">
                <h4 className="font-semibold mb-2 text-blue-900">🎓 Giải Thích Band Score</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {result.band_justification}
                </p>
              </div>
            )}

            {/* Reset Button */}
            <Button
              onClick={() => {
                setTranscript('');
                window.location.reload();
              }}
              variant="outline"
              className="w-full"
            >
              Chấm điểm câu trả lời khác
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
