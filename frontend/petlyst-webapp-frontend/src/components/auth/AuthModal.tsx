import React, { useState } from 'react';
import styled from 'styled-components';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  z-index: 1001;
`;

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <h2>{isLogin ? 'Giriş Yap' : 'Kayıt Ol'}</h2>
        {isLogin ? (
          // Giriş formu
          <form>
            {/* Giriş form alanları */}
          </form>
        ) : (
          // Kayıt formu
          <form>
            {/* Kayıt form alanları */}
          </form>
        )}
        <button onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Kayıt Ol' : 'Giriş Yap'}
        </button>
      </ModalContent>
    </ModalOverlay>
  );
};

export default AuthModal;