import React from 'react';

const TemplateGuide = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-teal-600 rounded-full"></div>
        <h3 className="text-2xl font-bold text-gray-800">Template Author Guide</h3>
      </div>

      <section>
        <h4 className="font-semibold text-gray-900 mb-2">Bundle layout (ZIP root)</h4>
        <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
          <li>manifest.json</li>
          <li>form-schema.json</li>
          <li>engine/ (index.html, game.js, style.css, assets/...)</li>
        </ul>
        <p className="text-gray-500 text-sm mt-2">No extra parent folder. All engine assets must be local (no external CDNs).</p>
      </section>

      <section>
        <h4 className="font-semibold text-gray-900 mb-2">manifest.json (additions)</h4>
        <p className="text-gray-700 text-sm mb-2">Keep your current fields. Add only these optional, stable fields:</p>
        <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
          <li>xp.assignment: {'{ enabled, amount, firstAttemptOnly }'}</li>
          <li>xp.online: {'{ enabled, amount }'}</li>
          <li>attemptPolicy: "first_only" | "all" (default: first_only)</li>
        </ul>
        <pre className="bg-gray-50 text-xs p-3 rounded-md border border-gray-200 overflow-auto">{`
{
  "name": "Arithmetic Sprint",
  "version": "1.0.0",
  "description": "Answer as many arithmetic questions as you can.",
  "gameType": "arithmetic-sprint",
  "engineEntry": "index.html",
  "xp": {
    "assignment": { "enabled": true, "amount": 50, "firstAttemptOnly": true },
    "online": { "enabled": false, "amount": 0 }
  },
  "attemptPolicy": "first_only"
}
`}</pre>
      </section>

      <section>
        <h4 className="font-semibold text-gray-900 mb-2">form-schema.json</h4>
        <p className="text-gray-700 text-sm">Defines the Create Game form:</p>
        <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
          <li>settings: simple fields (text, number, boolean, enum)</li>
          <li>content: array with itemSchema (e.g., question, options, correct index)</li>
        </ul>
      </section>

      <section>
        <h4 className="font-semibold text-gray-900 mb-2">Engine integration</h4>
        <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
          <li>Parent posts INIT_GAME with payload: creation data, settings, content, assignmentId, mode, isTest</li>
          <li>Engine shows a short countdown, runs gameplay</li>
          <li>On finish, engine posts GAME_COMPLETE with: {'{ gameCreationId, score, totalPossibleScore, ... }'}</li>
        </ul>
        <p className="text-gray-500 text-sm">Engines must not fetch external scripts. Keep everything local.</p>
      </section>

      <section>
        <h4 className="font-semibold text-gray-900 mb-2">Rules</h4>
        <ul className="list-disc pl-6 text-gray-700 text-sm space-y-1">
          <li>Students never play drafts. Admin/Teacher can test (no XP).</li>
          <li>Assignments: first attempt is counted by default; replays won’t change the report.</li>
          <li>Online XP only if enabled in manifest (admin policy).</li>
        </ul>
      </section>
    </div>
  );
};

export default TemplateGuide;
