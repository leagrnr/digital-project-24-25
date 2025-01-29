import { useState, useEffect } from 'react';

const CarbonFootprintQuiz = () => {
  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [monthlyCO2, setMonthlyCO2] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    fetchQuizData();
  }, []);

  const fetchQuizData = async () => {
    try {
      const response = await fetch('/simulator.json');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des questions');
      }
      const data = await response.json();
      setQuizData(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const calculateMonthlyCO2 = (newAnswers) => {
    return newAnswers.reduce((total, answer) => {
      if (answer.co2_kg_per_day) {
        return total + (answer.co2_kg_per_day * 22);
      }
      if (answer.co2_kg_per_year) {
        return total + (answer.co2_kg_per_year / 12);
      }
      return total;
    }, 0);
  };

  const getRecommendation = (co2) => {
    if (!quizData) return '';

    const annualCO2 = co2 * 12;
    const sortedRecommendations = quizData.recommendations
        .sort((a, b) => a.threshold - b.threshold);

    const recommendation = sortedRecommendations.find(rec => annualCO2 <= rec.threshold);
    return recommendation ? recommendation.message : sortedRecommendations[sortedRecommendations.length - 1].message;
  };

  const handleAnswer = (option) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = option;
    setAnswers(newAnswers);

    if (currentQuestion + 1 < quizData.quiz.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      const finalMonthlyCO2 = calculateMonthlyCO2(newAnswers);
      setMonthlyCO2(finalMonthlyCO2);
      setShowResults(true);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setMonthlyCO2(0);
    setShowResults(false);
    setAnswers([]);
  };

  if (loading) {
    return (
        <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Chargement du quiz...</span>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
          <div className="p-6">
            <div className="text-red-500">
              Erreur: {error}
            </div>
            <button
                onClick={fetchQuizData}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
    );
  }

  if (!quizData) return null;

  return (
      <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-center">
            Calculateur d'Empreinte Carbone Professionnelle
          </h1>
        </div>

        <div className="p-6">
          {!showResults ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-lg font-medium">
                    Question {currentQuestion + 1} sur {quizData.quiz.length}
                  </div>
                  {currentQuestion > 0 && (
                      <button
                          onClick={goToPreviousQuestion}
                          className="px-4 py-2 text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        ← Question précédente
                      </button>
                  )}
                </div>
                <div className="text-xl mb-6">
                  {quizData.quiz[currentQuestion].question}
                </div>
                <div className="grid gap-4">
                  {quizData.quiz[currentQuestion].options.map((option, index) => (
                      <button
                          key={index}
                          onClick={() => handleAnswer(option)}
                          className={`w-full text-left p-4 border rounded-lg transition-colors ${
                              answers[currentQuestion]?.answer === option.answer
                                  ? 'bg-blue-50 border-blue-500'
                                  : 'hover:bg-gray-50'
                          }`}
                      >
                        {option.answer}
                      </button>
                  ))}
                </div>
              </div>
          ) : (
              <div className="space-y-6">
                <div className="text-center text-2xl font-bold mb-4">
                  Ton empreinte carbone mensuelle : {Math.round(monthlyCO2)} kg CO2
                </div>
                <div className="text-center text-lg text-gray-600">
                  (soit environ {Math.round(monthlyCO2 * 12)} kg CO2 par an)
                </div>
                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="prose prose-sm max-w-none">
                    {getRecommendation(monthlyCO2)}
                  </div>
                </div>
                <button
                    onClick={resetQuiz}
                    className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Recommencer le quiz
                </button>
              </div>
          )}
        </div>
      </div>
  );
};

export default CarbonFootprintQuiz;