/**
 * @fileoverview Компонент раздела теории.
 * Предоставляет образовательные статьи о табулатурах, музыке и работе с редактором.
 * Включает систему тестов для проверки знаний и отслеживания прогресса.
 * 
 * @module components/theory/Theory
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  GraduationCap,
  Target,
  Clock,
  CheckCircle,
  Play,
  RotateCcw,
  Zap,
  ChevronRight,
  Award,
  Star,
  FileText,
  Eye,
  Users,
  Trophy,
  Sparkles,
  Music,
  Film,
  BookMarked,
  Library
} from 'lucide-react';
import './Theory.css';
import { 
  getTheoryProgress, 
  updateTheoryProgress, 
  completeArticle, 
  getTheoryStatistics, 
  TheoryProgress,
  TheoryStatistics 
} from '../../services/theoryService';

// ==================== ИНТЕРФЕЙСЫ ====================

interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  duration: string;
  difficulty: 'easy' | 'medium' | 'hard';
  order: number;
  quiz?: Quiz;
}

interface Quiz {
  questions: Question[];
  passingScore: number;
}

interface Question {
  id: string;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'practical';
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  codeExample?: string;
  expectedOutput?: string;
}

// ==================== ДАННЫЕ СТАТЕЙ ====================

const articles: Article[] = [
  {
    id: 'intro',
    title: 'Введение в табулатуры',
    description: 'Что такое табулатуры и зачем они нужны',
    content: `
      <h3>Что такое табулатуры?</h3>
      <p>Табулатура (или таб) - это форма нотной записи, предназначенная для струнных инструментов. В отличие от стандартной нотной записи, табулатура показывает не высоту звука, а то, на какой лад и на какой струне нужно зажать инструмент.</p>
      
      <h3>Преимущества табулатур:</h3>
      <ul>
        <li>Интуитивно понятны для гитаристов</li>
        <li>Не требуют знания нотной грамоты</li>
        <li>Показывают точную аппликатуру</li>
        <li>Легко записывать и читать</li>
      </ul>
      
      <h3>Где используются:</h3>
      <p>Табулатуры широко используются в рок, метал, фолк и классической музыке. Они особенно популярны среди начинающих гитаристов и в онлайн-сообществах.</p>
    `,
    duration: '5 мин',
    difficulty: 'easy',
    order: 1,
    quiz: {
      questions: [
        {
          id: 'intro-1',
          text: 'Что показывает табулатура?',
          type: 'multiple-choice',
          options: [
            'Высоту звука в нотах',
            'Номер лада и струну для зажатия',
            'Аккордовую последовательность',
            'Текст песни'
          ],
          correctAnswer: 'Номер лада и струну для зажатия',
          explanation: 'Табулатура показывает конкретные позиции на грифе - какой лад и на какой струне нужно зажать.'
        },
        {
          id: 'intro-2',
          text: 'Табулатуры требуют обязательного знания нотной грамоты',
          type: 'true-false',
          options: ['True', 'False'],
          correctAnswer: 'False',
          explanation: 'Табулатуры специально созданы для тех, кто не знает нотную грамоту. Они показывают точные позиции на грифе.'
        }
      ],
      passingScore: 70
    }
  },
  {
    id: 'basics',
    title: 'Основы чтения табулатур',
    description: 'Как читать и понимать табулатуры',
    content: `
      <h3>Структура табулатуры</h3>
      <p>Стандартная табулатура для гитары состоит из 6 линий, каждая из которых представляет струну:</p>
      <ul>
        <li>Верхняя линия = 1-я струна (самая тонкая, E)</li>
        <li>Вторая линия = 2-я струна (B)</li>
        <li>Третья линия = 3-я струна (G)</li>
        <li>Четвертая линия = 4-я струна (D)</li>
        <li>Пятая линия = 5-я струна (A)</li>
        <li>Нижняя линия = 6-я струна (самая толстая, E)</li>
      </ul>
      
      <h3>Числа на линиях</h3>
      <p>Числа на линиях указывают номер лада, который нужно зажать:</p>
      <ul>
        <li>"0" - открытая струна (не зажатая)</li>
        <li>"1" - первый лад</li>
        <li>"2" - второй лад</li>
        <li>И так далее...</li>
      </ul>
    `,
    duration: '10 мин',
    difficulty: 'easy',
    order: 2,
    quiz: {
      questions: [
        {
          id: 'basics-1',
          text: 'Сколько линий в стандартной гитарной табулатуре?',
          type: 'multiple-choice',
          options: ['4', '5', '6', '7'],
          correctAnswer: '6',
          explanation: 'Стандартная гитарная табулатура имеет 6 линий, соответствующих 6 струнам гитары.'
        },
        {
          id: 'basics-2',
          text: 'Что означает цифра "0" в табулатуре?',
          type: 'multiple-choice',
          options: [
            'Ноту нужно сыграть на нулевом ладу (открытая струна)',
            'Пропустить эту ноту',
            'Сыграть тише',
            'Повторить предыдущую ноту'
          ],
          correctAnswer: 'Ноту нужно сыграть на нулевом ладу (открытая струна)',
          explanation: '"0" обозначает открытую струну, которую не нужно зажимать на ладах.'
        }
      ],
      passingScore: 70
    }
  },
  {
    id: 'notations',
    title: 'Специальные обозначения',
    description: 'Приемы игры и специальные символы',
    content: `
      <h3>Основные приемы игры:</h3>
      
      <h4>Хаммер-он (Hammer-on)</h4>
      <p>Обозначается как "h" или дугой между нотами. Пример: "5h7" - нужно ударить по 5-му ладу, затем, не отпуская, прижать 7-й лад.</p>
      
      <h4>Пуллинг-офф (Pull-off)</h4>
      <p>Обозначается как "p" или дугой. Пример: "7p5" - зажать 7-й и 5-й лады, ударить по 7-му и снять палец.</p>
      
      <h4>Бенд (Bend)</h4>
      <p>Обозначается как "b" или стрелкой вверх. Пример: "7b9" - зажать 7-й лад и подтянуть струну до звучания 9-го лада.</p>
      
      <h4>Вибрато (Vibrato)</h4>
      <p>Обозначается как "v" или "~" - покачивание пальца для создания колебаний звука.</p>
    `,
    duration: '15 мин',
    difficulty: 'medium',
    order: 3,
    quiz: {
      questions: [
        {
          id: 'notations-1',
          text: 'Какой символ обозначает хаммер-он в табулатуре?',
          type: 'multiple-choice',
          options: ['b', 'p', 'h', '/'],
          correctAnswer: 'h',
          explanation: 'Хаммер-он обозначается буквой "h" (hammer-on).'
        },
        {
          id: 'notations-2',
          text: 'Что означает запись "7b9" в табулатуре?',
          type: 'multiple-choice',
          options: [
            'Сыграть ноту на 7 ладу, затем на 9',
            'Сделать бенд с 7 до 9 лада',
            'Слайд с 7 на 9 лад',
            'Хаммер-он с 7 на 9 лад'
          ],
          correctAnswer: 'Сделать бенд с 7 до 9 лада',
          explanation: 'Буква "b" обозначает бенд - подтяжку струны с 7 лада до звучания 9.'
        }
      ],
      passingScore: 70
    }
  },
  {
    id: 'software',
    title: 'Работа с редактором табулатур',
    description: 'Полное руководство по использованию всех функций редактора',
    content: `
      <h3>Обзор интерфейса</h3>
      <p>Наш редактор табулатур предоставляет профессиональные инструменты для создания, редактирования и воспроизведения гитарных табулатур.</p>
      
      <h4>Горячие клавиши</h4>
      <ul>
        <li><strong>0-9</strong> - ввод лада</li>
        <li><strong>← → ↑ ↓</strong> - навигация по табулатуре</li>
        <li><strong>Delete / Backspace</strong> - удаление ноты</li>
        <li><strong>B, H, V</strong> - выбор инструментов (бенд, хаммер, вибрато)</li>
        <li><strong>Esc</strong> - отмена ввода</li>
      </ul>
    `,
    duration: '25 мин',
    difficulty: 'medium',
    order: 4,
    quiz: {
      questions: [
        {
          id: 'software-1',
          text: 'Какая клавиша используется для удаления ноты?',
          type: 'multiple-choice',
          options: ['Delete', 'Space', 'Enter', 'Tab'],
          correctAnswer: 'Delete',
          explanation: 'Клавиши Delete или Backspace удаляют текущую ноту в позиции курсора.'
        },
        {
          id: 'software-2',
          text: 'Как отменить ввод лада?',
          type: 'multiple-choice',
          options: ['Enter', 'Space', 'Esc', 'Tab'],
          correctAnswer: 'Esc',
          explanation: 'Клавиша Escape отменяет текущий ввод лада и очищает буфер.'
        }
      ],
      passingScore: 70
    }
  }
];

// ==================== КОМПОНЕНТ ВИКТОРИНЫ ====================

const QuizSection: React.FC<{ quiz: Quiz; onComplete: (passed: boolean, score: number) => void }> = ({ quiz, onComplete }) => {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    let correctCount = 0;
    quiz.questions.forEach(q => {
      const userAnswer = answers[q.id];
      if (userAnswer) {
        if (Array.isArray(q.correctAnswer)) {
          if (Array.isArray(userAnswer) && 
              q.correctAnswer.length === userAnswer.length &&
              q.correctAnswer.every(a => userAnswer.includes(a))) {
            correctCount++;
          }
        } else if (userAnswer === q.correctAnswer) {
          correctCount++;
        }
      }
    });
    const finalScore = (correctCount / quiz.questions.length) * 100;
    setScore(finalScore);
    setSubmitted(true);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  if (submitted) {
    const passed = score >= quiz.passingScore;
    return (
      <div className="quiz-results">
        <h4>
          {passed ? <Trophy size={24} /> : <Target size={24} />}
          {passed ? 'Результаты теста' : 'Тест не пройден'}
        </h4>
        <div className="score-display">
          <span className="score-value">{Math.round(score)}%</span>
          <div className="score-bar">
            <div className="score-fill" style={{ width: `${score}%` }} />
          </div>
        </div>
        <p className="score-message">
          {score >= quiz.passingScore 
            ? '🎉 Отлично! Вы успешно прошли тест!' 
            : '📚 Попробуйте еще раз, чтобы лучше усвоить материал'}
        </p>
        <div className="quiz-actions">
          <button className="retry-btn" onClick={handleRetry}>
            <RotateCcw size={16} />
            Пройти тест снова
          </button>
          <button 
            className="continue-btn" 
            onClick={() => onComplete(score >= quiz.passingScore, score)}
          >
            <ChevronRight size={16} />
            {score >= quiz.passingScore ? 'Продолжить' : 'Закрыть'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-section">
      <h4>
        <GraduationCap size={24} />
        Проверьте свои знания
      </h4>
      {quiz.questions.map((q, idx) => (
        <div key={q.id} className="quiz-question">
          <p className="question-text">
            <span className="question-number">{idx + 1}</span>
            {q.text}
          </p>
          {q.type === 'multiple-choice' && q.options && (
            <div className="options">
              {q.options.map(opt => (
                <label key={opt} className="option-label">
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}
          {q.type === 'true-false' && q.options && (
            <div className="options">
              {q.options.map(opt => (
                <label key={opt} className="option-label">
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={(e) => handleAnswer(q.id, e.target.value)}
                  />
                  <span>{opt === 'True' ? '✅ Правда' : '❌ Ложь'}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      ))}
      <button className="submit-quiz-btn" onClick={handleSubmit}>
        <CheckCircle size={18} />
        Проверить ответы
      </button>
    </div>
  );
};

// ==================== ОСНОВНОЙ КОМПОНЕНТ ====================

const Theory: React.FC = () => {
  const [progress, setProgress] = useState<TheoryProgress>({ 
    completedArticles: [], 
    lastRead: null, 
    quizScores: {}, 
    totalPoints: 0 
  });
  const [statistics, setStatistics] = useState<TheoryStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [savedProgress, stats] = await Promise.all([
          getTheoryProgress(),
          getTheoryStatistics().catch(() => null)
        ]);
        setProgress(savedProgress);
        if (stats) setStatistics(stats);
      } catch (error) {
        console.error('Error loading theory data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleQuizComplete = async (passed: boolean, score: number) => {
    if (passed && selectedArticle && !progress.completedArticles.includes(selectedArticle.id)) {
      try {
        const updatedProgress = await completeArticle(selectedArticle.id, score);
        setProgress(updatedProgress);
        
        const stats = await getTheoryStatistics();
        setStatistics(stats);
      } catch (error) {
        console.error('Error completing article:', error);
      }
    }
    setShowQuiz(false);
  };

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    setShowQuiz(false);
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'easy';
      case 'medium': return 'medium';
      case 'hard': return 'hard';
      default: return '';
    }
  };

  const getDifficultyText = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy': return 'Начинающий';
      case 'medium': return 'Средний';
      case 'hard': return 'Продвинутый';
      default: return '';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return <Zap size={12} />;
      case 'medium': return <Target size={12} />;
      case 'hard': return <Award size={12} />;
      default: return null;
    }
  };

  const filteredArticles = articles
    .filter(article => 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(article => difficultyFilter === 'all' || article.difficulty === difficultyFilter)
    .sort((a, b) => a.order - b.order);

  const completedCount = progress.completedArticles.length;
  const totalCount = articles.length;
  const completionPercentage = (completedCount / totalCount) * 100;

  if (isLoading) {
    return (
      <div className="theory-container">
        <div className="theory-loading">
          <div className="loading-spinner"></div>
          <p>Загрузка вашего прогресса...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="theory-container">
      <div className="theory-header">
        <h2>
          <Library size={28} />
          Теория музыки и табулатур
        </h2>
        <div className="progress-overview">
          <div className="progress-stats">
            <span className="progress-text">
              <BookMarked size={14} />
              Прогресс: {completedCount}/{totalCount} статей
            </span>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className="progress-percentage">{Math.round(completionPercentage)}%</span>
          </div>
          {statistics && (
            <div className="stats-mini">
              <span>
                <Star size={14} />
                {statistics.totalPoints} очков
              </span>
              <span>
                <Target size={14} />
                {Math.round(statistics.averageScore)}% средний балл
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="theory-content">
        <aside className="theory-sidebar">
          <div className="search-filter">
            <input
              type="text"
              placeholder="🔍 Поиск статей..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              aria-label="Поиск статей"
            />
            <select 
              value={difficultyFilter} 
              onChange={(e) => setDifficultyFilter(e.target.value as any)}
              className="filter-select"
              aria-label="Фильтр по сложности"
            >
              <option value="all">Все уровни</option>
              <option value="easy">Начинающий</option>
              <option value="medium">Средний</option>
              <option value="hard">Продвинутый</option>
            </select>
          </div>

          <div className="articles-list">
            {filteredArticles.map(article => (
              <div
                key={article.id}
                className={`article-item ${selectedArticle?.id === article.id ? 'active' : ''} ${progress.completedArticles.includes(article.id) ? 'completed' : ''}`}
                onClick={() => handleArticleClick(article)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleArticleClick(article)}
              >
                <div className="article-header">
                  <h3>{article.title}</h3>
                  {progress.completedArticles.includes(article.id) && (
                    <span className="completed-badge" aria-label="Изучено">
                      <CheckCircle size={14} />
                    </span>
                  )}
                </div>
                <p className="article-description">{article.description}</p>
                <div className="article-meta">
                  <span className={`difficulty-badge ${getDifficultyColor(article.difficulty)}`}>
                    {getDifficultyIcon(article.difficulty)}
                    {getDifficultyText(article.difficulty)}
                  </span>
                  <span className="duration-badge">
                    <Clock size={11} />
                    {article.duration}
                  </span>
                  {article.quiz && !progress.completedArticles.includes(article.id) && (
                    <span className="quiz-badge">
                      <GraduationCap size={11} />
                      Тест
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="theory-main">
          {selectedArticle ? (
            <div className="article-viewer">
              <div className="article-header">
                <h2>{selectedArticle.title}</h2>
                <div className="article-meta">
                  <span className={`difficulty-badge ${getDifficultyColor(selectedArticle.difficulty)}`}>
                    {getDifficultyIcon(selectedArticle.difficulty)}
                    {getDifficultyText(selectedArticle.difficulty)}
                  </span>
                  <span className="duration-badge">
                    <Clock size={12} />
                    {selectedArticle.duration}
                  </span>
                </div>
              </div>
              
              {!showQuiz ? (
                <>
                  <div 
                    className="article-content"
                    dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                  />
                  {selectedArticle.quiz && !progress.completedArticles.includes(selectedArticle.id) && (
                    <div className="quiz-prompt">
                      <button 
                        className="start-quiz-btn"
                        onClick={() => setShowQuiz(true)}
                        type="button"
                      >
                        <GraduationCap size={18} />
                        Пройти тест для завершения
                      </button>
                    </div>
                  )}
                  {progress.completedArticles.includes(selectedArticle.id) && (
                    <div className="article-complete">
                      <div className="complete-badge">
                        <CheckCircle size={20} />
                        Статья изучена 
                        {progress.quizScores[selectedArticle.id] && (
                          <span className="quiz-score"> (Балл: {progress.quizScores[selectedArticle.id]}%)</span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                selectedArticle.quiz && (
                  <QuizSection 
                    quiz={selectedArticle.quiz} 
                    onComplete={handleQuizComplete}
                  />
                )
              )}
            </div>
          ) : (
            <div className="theory-welcome">
              <div className="welcome-icon">
                <Music size={80} />
              </div>
              <h2>Добро пожаловать в раздел теории!</h2>
              <p>Выберите статью из списка слева, чтобы начать изучение табулатур.</p>
              <div className="quick-stats">
                <div className="stat">
                  <span className="stat-value">{statistics?.totalArticlesCompleted || 0}</span>
                  <span className="stat-label">
                    <BookOpen size={14} />
                    Изучено статей
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-value">{statistics?.totalPoints || 0}</span>
                  <span className="stat-label">
                    <Star size={14} />
                    Всего очков
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-value">{Math.round(statistics?.averageScore || 0)}%</span>
                  <span className="stat-label">
                    <Target size={14} />
                    Средний балл
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Theory;