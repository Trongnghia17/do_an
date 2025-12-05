import { useState } from 'react';
import { useAIGrading } from '@/hooks/useAIGrading';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

/**
 * Component for AI-powered Writing grading
 * Có thể tái sử dụng trong existing exam flow
 */
export const AIWritingGrading = ({ question, questionId, examType = 'IELTS', onGraded }) => {
  const [answer, setAnswer] = useState('');
  const { gradeWriting, loading, error, result } = useAIGrading();

  const handleSubmit = async () => {
    try {
      const gradingResult = await gradeWriting(
        questionId,
        question.content || question.question_text,
        answer,
        examType
      );
      
      if (onGraded) {
        onGraded(gradingResult);
      }
    } catch (err) {
      console.error('Grading error:', err);
    }
  };

  const wordCount = answer.trim().split(/\s+/).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{question.title || 'Writing Task'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose max-w-none">
            <p>{question.content || question.question_text}</p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium">Your Answer</label>
              <span className="text-sm text-gray-500">Words: {wordCount}</span>
            </div>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write your answer here..."
              rows={15}
              className="w-full"
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
              disabled={loading || !answer.trim() || wordCount < 10}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'AI is grading...' : 'Submit for AI Grading'}
            </Button>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Grading Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Score */}
            <div className="text-center p-6 bg-white rounded-lg">
              <div className="text-5xl font-bold text-blue-600">
                {result.overall_score.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 mt-2">Band Score (out of 9)</div>
            </div>

            {/* Criteria Scores */}
            {result.criteria_scores && Object.keys(result.criteria_scores).length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold mb-3">Detailed Scores</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(result.criteria_scores).map(([criterion, score]) => (
                    <div key={criterion} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm capitalize">
                        {criterion.replace(/_/g, ' ')}
                      </span>
                      <span className="font-semibold text-blue-600">
                        {typeof score === 'number' ? score.toFixed(1) : score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {result.strengths && result.strengths.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Strengths
                </h4>
                <ul className="space-y-1">
                  {result.strengths.map((strength, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex gap-2">
                      <span>•</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas for Improvement */}
            {result.weaknesses && result.weaknesses.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2 text-orange-700">
                  <XCircle className="h-4 w-4" />
                  Areas for Improvement
                </h4>
                <ul className="space-y-1">
                  {result.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex gap-2">
                      <span>•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Detailed Feedback */}
            {result.detailed_feedback && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold mb-2">Detailed Feedback</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {result.detailed_feedback}
                </p>
              </div>
            )}

            {/* Suggestions */}
            {result.suggestions && result.suggestions.length > 0 && (
              <div className="bg-white rounded-lg p-4">
                <h4 className="font-semibold mb-2">Suggestions for Improvement</h4>
                <ul className="space-y-1">
                  {result.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex gap-2">
                      <span>{idx + 1}.</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
