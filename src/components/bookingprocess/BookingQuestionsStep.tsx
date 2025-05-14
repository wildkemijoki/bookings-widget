import React from 'react';
import type { Experience, BookingState } from '../../types';

interface BookingQuestionsStepProps {
  experience: Experience;
  bookingState: BookingState;
  onUpdateQuestionAnswer: (questionId: string, answer: string | boolean, participantId?: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function BookingQuestionsStep({
  experience,
  bookingState,
  onUpdateQuestionAnswer,
  onContinue,
  onBack
}: BookingQuestionsStepProps) {
  const bookingQuestions = React.useMemo(() => {
    if (!experience?.bookingQuestions) {
      return [];
    }
    return experience.bookingQuestions;
  }, [experience]);

  const filteredQuestions = React.useMemo(() => {
    if (!bookingQuestions?.length) return [];

    const uniqueQuestions = new Map();

    bookingQuestions.forEach(question => {
      let shouldInclude = false;

      switch (question.type) {
        case 'booking':
          shouldInclude = true;
          break;

        case 'category':
          if (question.applicableCategories?.length) {
            shouldInclude = Object.entries(bookingState.participants).some(([categoryId, count]) =>
              count > 0 && question.applicableCategories.some(cat => cat.toString() === categoryId)
            );
          }
          break;

        case 'extra':
          if (question.applicableExtras?.length) {
            shouldInclude = bookingState.extras?.some(extraId =>
              question.applicableExtras?.includes(extraId)
            );
          }
          break;
      }

      if (shouldInclude) {
        uniqueQuestions.set(question._id, question);
      }
    });

    return Array.from(uniqueQuestions.values());
  }, [bookingQuestions, bookingState.participants, bookingState.extras]);

  const renderQuestionInput = (question: typeof filteredQuestions[0], participantId?: string) => {
    const key = participantId ? `${question._id}-${participantId}` : question._id;
    const answer = bookingState.bookingQuestions[key]?.answer;
    const isRequired = question.required && question.requiredStage === 'beforeCheckout';

    switch (question.inputType) {
      case 'textarea':
        return (
          <textarea
            value={typeof answer === 'string' ? answer : ''}
            onChange={(e) => onUpdateQuestionAnswer(question._id, e.target.value, participantId)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            rows={4}
            placeholder="Enter your answer"
            required={isRequired}
          />
        );
      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={typeof answer === 'boolean' ? answer : false}
              onChange={(e) => onUpdateQuestionAnswer(question._id, e.target.checked, participantId)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              required={isRequired}
            />
            <span className="text-sm text-gray-600">{question.helpText}</span>
          </div>
        );
      case 'list':
        return (
          <select
            value={typeof answer === 'string' ? answer : ''}
            onChange={(e) => onUpdateQuestionAnswer(question._id, e.target.value, participantId)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            required={isRequired}
          >
            <option value="">Select an option</option>
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={typeof answer === 'string' ? answer : ''}
            onChange={(e) => onUpdateQuestionAnswer(question._id, e.target.value, participantId)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter your answer"
            required={isRequired}
          />
        );
    }
  };

  const renderParticipantQuestions = (question: typeof filteredQuestions[0]) => {
    if (!question.applicableCategories?.length) return null;
  
    const blocks: JSX.Element[] = [];
    const rendered = new Set<string>();
  
    if (question.perPerson) {
      blocks.push(
        <div key={`question-${question._id}`} className="mb-6">
          <div className="text-gray-700">
            {question.question}
            {question.required && question.requiredStage === 'beforeCheckout' && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </div>
          {question.helpText && question.inputType !== 'checkbox' && (
            <div className="text-sm text-gray-500 mb-4">{question.helpText}</div>
          )}
        </div>
      );

      Object.entries(bookingState.participants).forEach(([categoryId, count]) => {
        if (count === 0 || !question.applicableCategories?.includes(categoryId)) return;
  
        const pricingCategory = experience.usedPricingCategories.find(
          p => p.category._id === categoryId
        );
        if (!pricingCategory) return;
        const categoryName = pricingCategory.category.name;
  
        for (let i = 0; i < count; i++) {
          const participantId = `${categoryId}-${i}`;
          const key = `${question._id}-${participantId}`;
          if (rendered.has(key)) continue;
          rendered.add(key);
  
          blocks.push(
            <div key={key} className="flex items-center gap-4 mb-4">
              <div className="w-40 flex-shrink-0 text-sm font-medium text-gray-500">
                {categoryName} {i + 1}
              </div>
              <div className="flex-grow">
                {renderQuestionInput(question, participantId)}
              </div>
            </div>
          );
        }
      });
    } else {
      const key = question._id;
      if (!rendered.has(key)) {
        rendered.add(key);
        blocks.push(
          <div key={key} className="mb-4">
            <div className="text-gray-700 mb-2">
              {question.question}
              {question.required && question.requiredStage === 'beforeCheckout' && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </div>
            {question.helpText && question.inputType !== 'checkbox' && (
              <div className="text-sm text-gray-500 mb-2">{question.helpText}</div>
            )}
            <div className="flex-grow">
              {renderQuestionInput(question)}
            </div>
          </div>
        );
      }
    }
  
    return blocks.length > 0 ? blocks : null;
  };

  const renderExtraQuestions = (question: typeof filteredQuestions[0]) => {
    if (!question.applicableExtras?.length) return null;

    const alreadyRendered = new Set<string>();
    if (alreadyRendered.has(question._id)) return null;
    alreadyRendered.add(question._id);

    const applicableExtraIds = bookingState.extras.filter(extraId =>
      question.applicableExtras?.includes(extraId)
    );

    const totalQuantity = applicableExtraIds.reduce((sum, extraId) => {
      return sum + (bookingState.extraQuantities?.[extraId] || 0);
    }, 0);

    if (question.perPerson) {
      const blocks = [
        <div key={`question-${question._id}`} className="mb-6">
          <div className="text-gray-700">
            {question.question}
            {question.required && question.requiredStage === 'beforeCheckout' && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </div>
          {question.helpText && question.inputType !== 'checkbox' && (
            <div className="text-sm text-gray-500 mb-4">{question.helpText}</div>
          )}
        </div>
      ];

      Array.from({ length: totalQuantity }).forEach((_, index) => {
        const participantId = `${question._id}-extra-${index}`;
        blocks.push(
          <div key={participantId} className="flex items-center gap-4 mb-4">
            <div className="w-40 flex-shrink-0 text-sm font-medium text-gray-500">
              Extra {index + 1}
            </div>
            <div className="flex-grow">
              {renderQuestionInput(question, participantId)}
            </div>
          </div>
        );
      });

      return blocks;
    }

    return (
      <div key={question._id} className="mb-4">
        <div className="text-gray-700 mb-2">
          {question.question}
          {question.required && question.requiredStage === 'beforeCheckout' && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </div>
        {question.helpText && question.inputType !== 'checkbox' && (
          <div className="text-sm text-gray-500 mb-2">{question.helpText}</div>
        )}
        <div className="flex-grow">
          {renderQuestionInput(question)}
        </div>
      </div>
    );
  };

  const beforeCheckoutQuestions = filteredQuestions.filter(q => q.requiredStage === 'beforeCheckout');
  const afterBookingQuestions = filteredQuestions.filter(q => q.requiredStage === 'afterBooking');

  if (!filteredQuestions.length) {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Information</h2>
        <div className="bg-white rounded-xl shadow-sm p-6 text-center text-gray-500">
          No additional information required
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Information</h2>

      <div className="space-y-6">
        {beforeCheckoutQuestions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Information</h3>
            <div className="space-y-6">
              {beforeCheckoutQuestions.map(question => {
                let content = null;
              
                switch (question.type) {
                  case 'booking':
                    content = (
                      <div key={question._id} className="mb-4">
                        <div className="text-gray-700 mb-2">
                          {question.question}
                          {question.required && question.requiredStage === 'beforeCheckout' && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </div>
                        {question.helpText && question.inputType !== 'checkbox' && (
                          <div className="text-sm text-gray-500 mb-2">{question.helpText}</div>
                        )}
                        <div className="flex-grow">
                          {renderQuestionInput(question)}
                        </div>
                      </div>
                    );
                    break;
                  case 'category':
                    content = renderParticipantQuestions(question);
                    break;
                  case 'extra':
                    content = renderExtraQuestions(question);
                    break;
                  default:
                    return null;
                }
              
                if (!content) return null;
              
                return (
                  <div key={question._id} className="space-y-6">
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {afterBookingQuestions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Questions</h3>
            <p className="text-sm text-gray-500 mb-6">
              These questions are optional now and can be answered after booking.
            </p>
            <div className="space-y-6">
              {afterBookingQuestions.map(question => (
                <div key={question._id} className="space-y-6">
                  {question.type === 'booking' && (
                    <div className="mb-4">
                      <div className="text-gray-700 mb-2">
                        {question.question}
                        {question.required && question.requiredStage === 'beforeCheckout' && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </div>
                      {question.helpText && question.inputType !== 'checkbox' && (
                        <div className="text-sm text-gray-500 mb-2">{question.helpText}</div>
                      )}
                      {renderQuestionInput(question)}
                    </div>
                  )}
                  {question.type === 'category' && renderParticipantQuestions(question)}
                  {question.type === 'extra' && renderExtraQuestions(question)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}