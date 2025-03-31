import React from 'react';
import {
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
  PaperClipIcon,
  MapPinIcon,
  EnvelopeIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  PhotoIcon,
  CameraIcon,
  ExclamationCircleIcon,
  CheckIcon,
  HomeIcon,
  HeartIcon,
  CogIcon,
  BellIcon,
  UserIcon,
  ShoppingBagIcon,
  ArrowLeftIcon,
  PhoneIcon,
  CalendarIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

// Define size variants
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface IconProps {
  size?: IconSize;
  className?: string;
}

// Size mapping
const sizeClasses: Record<IconSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
};

// Helper to apply consistent sizing and additional classes
const withSize = (Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>) => {
  return ({ size = 'md', className = '' }: IconProps) => {
    const sizeClass = sizeClasses[size];
    return <Icon className={`${sizeClass} ${className}`} aria-hidden="true" />;
  };
};

// Export all icons with consistent sizing interface
export const SearchIcon = withSize(MagnifyingGlassIcon);
export const ClinicIcon = withSize(BuildingOffice2Icon);
export const ServiceIcon = withSize(PaperClipIcon);
export const LocationIcon = withSize(MapPinIcon);
export const EmailIcon = withSize(EnvelopeIcon);
export const ClockImageIcon = withSize(ClockIcon);
export const DocumentIcon = withSize(DocumentTextIcon);
export const StaffIcon = withSize(UserGroupIcon);
export const InventoryIcon = withSize(ArchiveBoxIcon);
export const RefreshIcon = withSize(ArrowPathIcon);
export const WarningIcon = withSize(ExclamationTriangleIcon);
export const DropdownIcon = withSize(ChevronDownIcon);
export const AddIcon = withSize(PlusIcon);
export const DeleteIcon = withSize(TrashIcon);
export const SuccessIcon = withSize(CheckCircleIcon);
export const ErrorIcon = withSize(XCircleIcon);
export const ArrowRightImageIcon = withSize(ArrowRightIcon);
export const ImageIcon = withSize(PhotoIcon);
export const CameraImageIcon = withSize(CameraIcon);
export const AlertIcon = withSize(ExclamationCircleIcon);
export const CheckmarkIcon = withSize(CheckIcon);
export const HomeImageIcon = withSize(HomeIcon);
export const HeartImageIcon = withSize(HeartIcon);
export const SettingsIcon = withSize(CogIcon);
export const NotificationIcon = withSize(BellIcon);
export const ProfileIcon = withSize(UserIcon);
export const CartIcon = withSize(ShoppingBagIcon);
export const BackIcon = withSize(ArrowLeftIcon);
export const PhoneImageIcon = withSize(PhoneIcon);
export const CalendarImageIcon = withSize(CalendarIcon);
export const InfoIcon = withSize(InformationCircleIcon); 