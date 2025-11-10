/**
 * Componente Welcome
 * 
 * Mensagem de boas-vindas exibida quando nenhum site SEI foi detectado
 */

import React from 'react';

export function Welcome() {
  return (
    <div className="welcome-message">
      <div className="empty-state-icon">📋</div>
      <div className="empty-state-text">
        Nenhum site SEI foi adicionado ainda.<br />
        Navegue para um site SEI para começar.
      </div>
    </div>
  );
}
