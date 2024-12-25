import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

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

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const StyledField = styled(Field)`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const StyledErrorMessage = styled(ErrorMessage)`
  color: red;
  font-size: 0.8em;
`;

const SubmitButton = styled.button`
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const loginValidationSchema = Yup.object().shape({
  email: Yup.string().email('Geçerli bir e-posta adresi girin').required('E-posta adresi gerekli'),
  password: Yup.string().required('Şifre gerekli'),
});

const registerValidationSchema = Yup.object().shape({
  userType: Yup.string().required('Kullanıcı tipi seçimi gerekli'),
  email: Yup.string().email('Geçerli bir e-posta adresi girin').required('E-posta adresi gerekli'),
  password: Yup.string().min(6, 'Şifre en az 6 karakter olmalı').required('Şifre gerekli'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Şifreler eşleşmeli')
    .required('Şifre onayı gerekli'),
});

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
`;

const Tab = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 10px;
  border: none;
  background-color: ${props => props.active ? '#007bff' : '#f0f0f0'};
  color: ${props => props.active ? 'white' : 'black'};
  cursor: pointer;
  transition: background-color 0.3s;

  &:first-child {
    border-top-left-radius: 8px;
    border-bottom-left-radius: 8px;
  }

  &:last-child {
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
  }

  &:hover {
    background-color: ${props => props.active ? '#0056b3' : '#e0e0e0'};
  }
`;

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (values: any, { setSubmitting }: any) => {
    console.log(values);
    // Burada giriş veya kayıt işlemlerini gerçekleştirin
    setSubmitting(false);
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <TabContainer>
          <Tab active={isLogin} onClick={() => setIsLogin(true)}>Giriş Yap</Tab>
          <Tab active={!isLogin} onClick={() => setIsLogin(false)}>Kayıt Ol</Tab>
        </TabContainer>
        <Formik
          initialValues={isLogin ? 
            { email: '', password: '' } : 
            { userType: '', email: '', password: '', confirmPassword: '' }
          }
          validationSchema={isLogin ? loginValidationSchema : registerValidationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <StyledForm>
              {!isLogin && (
                <>
                  <RadioGroup>
                    <RadioLabel>
                      <Field type="radio" name="userType" value="veterinary" />
                      Veteriner
                    </RadioLabel>
                    <RadioLabel>
                      <Field type="radio" name="userType" value="petParent" />
                      Evcil Hayvan Sahibi
                    </RadioLabel>
                  </RadioGroup>
                  <StyledErrorMessage name="userType" component="div" />
                </>
              )}

              <StyledField type="email" name="email" placeholder="E-posta" />
              <StyledErrorMessage name="email" component="div" />

              <StyledField type="password" name="password" placeholder="Şifre" />
              <StyledErrorMessage name="password" component="div" />

              {!isLogin && (
                <>
                  <StyledField type="password" name="confirmPassword" placeholder="Şifreyi Onayla" />
                  <StyledErrorMessage name="confirmPassword" component="div" />
                </>
              )}

              <SubmitButton type="submit" disabled={isSubmitting}>
                {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
              </SubmitButton>
            </StyledForm>
          )}
        </Formik>
      </ModalContent>
    </ModalOverlay>
  );
};

export default AuthModal;
