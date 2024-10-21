import { useState } from "react";
import styled from "styled-components";
import AuthModal from "../auth/AuthModal";

const HeaderWrapper = styled.header`
  background-color: #f8f9fa;
  max-width: 1200px;
  width: 100%;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const CenteredContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  width: 100%;
`;

const Title = styled.h1`
  color: #333;
`;

const Nav = styled.nav`
  ul {
    list-style-type: none;
    display: flex;
    gap: 1rem;
  }
`;

const Header: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  
  return (
    <CenteredContainer>
      <HeaderWrapper>
        <Title>Petlyst</Title>
        <Nav>
          <ul>
            <li>
              <a href="/">Ana Sayfa</a>
            </li>
            <li>
              <a href="/hakkimizda">Hakkımızda</a>
            </li>
            <li>
              <a href="/iletisim">İletişim</a>
            </li>
            <li>
              <a href="#" onClick={openModal}>Giriş Yap</a>
            </li>
          </ul>
        </Nav>
      </HeaderWrapper>
      <AuthModal isOpen={isModalOpen} onClose={closeModal} />
    </CenteredContainer>
  );
};

export default Header;
