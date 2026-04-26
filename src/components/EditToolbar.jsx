import React from 'react';

export const EditToolbar = ({ onAction }) => (
  <div className="edit-toolbar">
    <button className="tool-btn" onClick={() => onAction('text')} title="Add Text">
      <span className="icon">T</span> Text
    </button>
    <button className="tool-btn" onClick={() => onAction('highlight')} title="Highlight">
      <span className="icon">H</span> Highlight
    </button>
    <button className="tool-btn" onClick={() => onAction('draw')} title="Draw">
      <span className="icon">D</span> Draw
    </button>
    <button className="tool-btn" onClick={() => onAction('sign')} title="Sign">
      <span className="icon">S</span> Sign
    </button>
    <button className="tool-btn" onClick={() => onAction('eraser')} title="Eraser">
      <span className="icon">E</span> Eraser
    </button>
  </div>
);