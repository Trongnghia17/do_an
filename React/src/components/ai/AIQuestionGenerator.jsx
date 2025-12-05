import { useState } from 'react';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles } from 'lucide-react';

/**
 * Component for AI question generation
 * Admin/Teacher tool để sinh câu hỏi tự động
 */
export const AIQuestionGenerator = ({ onQuestionsGenerated }) => {
  const [config, setConfig] = useState({
    examType: 'IELTS',
    skill: 'Reading',
    topic: '',
    difficulty: 'medium',
    numQuestions: 5,
  });

  const { generateQuestions, loading, error, result } = useAIGeneration();

  const handleGenerate = async () => {
    try {
      const data = await generateQuestions(config);
      
      if (onQuestionsGenerated) {
        onQuestionsGenerated(data.questions);
      }
    } catch (err) {
      console.error('Generation error:', err);
    }
  };

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Question Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Exam Type */}
            <div className="space-y-2">
              <Label>Exam Type</Label>
              <Select 
                value={config.examType} 
                onValueChange={(value) => updateConfig('examType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IELTS">IELTS</SelectItem>
                  <SelectItem value="TOEIC">TOEIC</SelectItem>
                  <SelectItem value="TOEFL">TOEFL</SelectItem>
                  <SelectItem value="General">General English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Skill */}
            <div className="space-y-2">
              <Label>Skill</Label>
              <Select 
                value={config.skill} 
                onValueChange={(value) => updateConfig('skill', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Listening">Listening</SelectItem>
                  <SelectItem value="Reading">Reading</SelectItem>
                  <SelectItem value="Writing">Writing</SelectItem>
                  <SelectItem value="Speaking">Speaking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty */}
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select 
                value={config.difficulty} 
                onValueChange={(value) => updateConfig('difficulty', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Number of Questions */}
            <div className="space-y-2">
              <Label>Number of Questions</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={config.numQuestions}
                onChange={(e) => updateConfig('numQuestions', parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* Topic */}
          <div className="space-y-2">
            <Label>Topic</Label>
            <Input
              placeholder="e.g., Environment, Technology, Education..."
              value={config.topic}
              onChange={(e) => updateConfig('topic', e.target.value)}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleGenerate}
            disabled={loading || !config.topic.trim()}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Generating Questions...' : 'Generate Questions with AI'}
          </Button>
        </CardContent>
      </Card>

      {result && result.questions && result.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Questions ({result.questions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.questions.map((question, idx) => (
                <div key={idx} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">Question {idx + 1}</h4>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {question.question_type || 'N/A'}
                    </span>
                  </div>
                  
                  <p className="text-sm mb-2">{question.content}</p>
                  
                  {question.options && (
                    <div className="mt-2 space-y-1">
                      {question.options.map((option, optIdx) => (
                        <div 
                          key={optIdx} 
                          className={`text-sm p-2 rounded ${
                            option === question.correct_answer 
                              ? 'bg-green-100 font-medium' 
                              : 'bg-white'
                          }`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {question.correct_answer && !question.options && (
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Answer: </span>
                      <span className="text-green-700">{question.correct_answer}</span>
                    </div>
                  )}
                  
                  {question.explanation && (
                    <div className="mt-2 text-xs text-gray-600">
                      <span className="font-medium">Explanation: </span>
                      {question.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
