import React from 'react';
import { IconType } from 'react-icons';
import { FaPaw, FaHospital, FaUserMd, FaShoppingBag, FaDog, FaCat } from 'react-icons/fa';
import { BsShop, BsCalendarCheck, BsPerson } from 'react-icons/bs';
import { MdPets, MdLocalHospital, MdOutlineHealthAndSafety } from 'react-icons/md';
import { HiOutlineMail, HiOutlineLocationMarker, HiOutlinePhone, HiOutlineCalendar, HiSearch, HiArrowRight, HiExclamationCircle } from 'react-icons/hi';
import { IoIosWarning } from 'react-icons/io';

// Define size variants
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IconProps {
  icon: IconType;
  size?: IconSize;
  className?: string;
}

// Size mapping in pixels (you can adjust these values)
const sizeValues: Record<IconSize, number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32
};

// Icon component with consistent sizing and styling
export const Icon = ({ icon: IconComponent, size = 'md', className = '' }: IconProps) => {
  return <IconComponent size={sizeValues[size]} className={className} />;
};

// Pre-configured icons for common use cases
export const PetIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={MdPets} {...props} />;
export const DogIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={FaDog} {...props} />;
export const CatIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={FaCat} {...props} />;
export const PawIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={FaPaw} {...props} />;
export const ClinicIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={FaHospital} {...props} />;
export const VetIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={FaUserMd} {...props} />;
export const ShopIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={BsShop} {...props} />;
export const ProductIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={FaShoppingBag} {...props} />;
export const MedicalIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={MdLocalHospital} {...props} />;
export const HealthIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={MdOutlineHealthAndSafety} {...props} />;
export const AppointmentIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={BsCalendarCheck} {...props} />;
export const PersonIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={BsPerson} {...props} />;

// Communication icons
export const EmailIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={HiOutlineMail} {...props} />;
export const PhoneIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={HiOutlinePhone} {...props} />;
export const LocationIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={HiOutlineLocationMarker} {...props} />;
export const CalendarIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={HiOutlineCalendar} {...props} />;

// UI element icons
export const SearchIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={HiSearch} {...props} />;
export const ArrowRightIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={HiArrowRight} {...props} />;
export const WarningIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={IoIosWarning} {...props} />;
export const AlertIcon = (props: Omit<IconProps, 'icon'>) => <Icon icon={HiExclamationCircle} {...props} />; 