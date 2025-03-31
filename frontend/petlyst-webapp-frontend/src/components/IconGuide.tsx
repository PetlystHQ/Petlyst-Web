import React from 'react';
import {
  PetIcon,
  DogIcon,
  CatIcon,
  PawIcon,
  ClinicIcon,
  VetIcon,
  ShopIcon,
  ProductIcon,
  MedicalIcon,
  HealthIcon,
  AppointmentIcon,
  PersonIcon,
  EmailIcon,
  PhoneIcon,
  LocationIcon,
  CalendarIcon,
  SearchIcon,
  ArrowRightIcon,
  WarningIcon,
  AlertIcon,
  IconSize
} from '../components/ui/ReactIcons';

// Icon showcase component
const IconShowcase: React.FC<{
  name: string;
  icon: React.ReactNode;
}> = ({ name, icon }) => (
  <div className="flex items-center p-3 border rounded-md">
    <div className="mr-3">{icon}</div>
    <div className="text-sm font-medium">{name}</div>
  </div>
);

// Size showcase component
const SizeShowcase: React.FC<{
  icon: (props: { size: IconSize; className?: string }) => JSX.Element;
}> = ({ icon: Icon }) => (
  <div className="flex items-center space-x-4 p-3 border rounded-md">
    <div className="flex items-center">
      <Icon size="xs" />
      <span className="ml-1 text-xs">xs</span>
    </div>
    <div className="flex items-center">
      <Icon size="sm" />
      <span className="ml-1 text-xs">sm</span>
    </div>
    <div className="flex items-center">
      <Icon size="md" />
      <span className="ml-1 text-xs">md</span>
    </div>
    <div className="flex items-center">
      <Icon size="lg" />
      <span className="ml-1 text-xs">lg</span>
    </div>
    <div className="flex items-center">
      <Icon size="xl" />
      <span className="ml-1 text-xs">xl</span>
    </div>
  </div>
);

// Color showcase component
const ColorShowcase: React.FC<{
  icon: (props: { size: IconSize; className?: string }) => JSX.Element;
}> = ({ icon: Icon }) => (
  <div className="flex items-center space-x-4 p-3 border rounded-md">
    <Icon size="lg" className="text-blue-500" />
    <Icon size="lg" className="text-red-500" />
    <Icon size="lg" className="text-green-500" />
    <Icon size="lg" className="text-purple-500" />
    <Icon size="lg" className="text-yellow-500" />
  </div>
);

const IconGuide: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Icon Guide</h1>
      
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Icon Sizes</h2>
        <p className="mb-4">All icons support 5 size variants: xs, sm, md, lg, xl</p>
        <div className="bg-white rounded-lg shadow-md p-6">
          <SizeShowcase icon={PetIcon} />
        </div>
      </section>
      
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Icon Colors</h2>
        <p className="mb-4">Icons inherit color by default, but can be styled with Tailwind classes</p>
        <div className="bg-white rounded-lg shadow-md p-6">
          <ColorShowcase icon={PetIcon} />
        </div>
      </section>
      
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Pet Related Icons</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <IconShowcase name="PetIcon" icon={<PetIcon size="lg" />} />
          <IconShowcase name="DogIcon" icon={<DogIcon size="lg" />} />
          <IconShowcase name="CatIcon" icon={<CatIcon size="lg" />} />
          <IconShowcase name="PawIcon" icon={<PawIcon size="lg" />} />
        </div>
      </section>
      
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Medical & Services Icons</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <IconShowcase name="ClinicIcon" icon={<ClinicIcon size="lg" />} />
          <IconShowcase name="VetIcon" icon={<VetIcon size="lg" />} />
          <IconShowcase name="MedicalIcon" icon={<MedicalIcon size="lg" />} />
          <IconShowcase name="HealthIcon" icon={<HealthIcon size="lg" />} />
          <IconShowcase name="ShopIcon" icon={<ShopIcon size="lg" />} />
          <IconShowcase name="ProductIcon" icon={<ProductIcon size="lg" />} />
        </div>
      </section>
      
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Contact & Schedule Icons</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <IconShowcase name="EmailIcon" icon={<EmailIcon size="lg" />} />
          <IconShowcase name="PhoneIcon" icon={<PhoneIcon size="lg" />} />
          <IconShowcase name="LocationIcon" icon={<LocationIcon size="lg" />} />
          <IconShowcase name="CalendarIcon" icon={<CalendarIcon size="lg" />} />
          <IconShowcase name="AppointmentIcon" icon={<AppointmentIcon size="lg" />} />
          <IconShowcase name="PersonIcon" icon={<PersonIcon size="lg" />} />
        </div>
      </section>
      
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">UI Icons</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <IconShowcase name="SearchIcon" icon={<SearchIcon size="lg" />} />
          <IconShowcase name="ArrowRightIcon" icon={<ArrowRightIcon size="lg" />} />
          <IconShowcase name="WarningIcon" icon={<WarningIcon size="lg" />} />
          <IconShowcase name="AlertIcon" icon={<AlertIcon size="lg" />} />
        </div>
      </section>
      
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Usage Examples</h2>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium mb-3">Basic Usage</h3>
          <pre className="bg-gray-100 p-4 rounded-md text-sm mb-6">
            {`import { SearchIcon } from '../components/ui/ReactIcons';\n\n<SearchIcon size="md" />`}
          </pre>
          
          <h3 className="text-lg font-medium mb-3">With Custom Color</h3>
          <pre className="bg-gray-100 p-4 rounded-md text-sm mb-6">
            {`<SearchIcon size="lg" className="text-blue-500" />`}
          </pre>
          
          <h3 className="text-lg font-medium mb-3">Inside a Button</h3>
          <pre className="bg-gray-100 p-4 rounded-md text-sm">
            {`<button className="flex items-center">\n  <span>Search</span>\n  <SearchIcon size="sm" className="ml-2" />\n</button>`}
          </pre>
        </div>
      </section>
    </div>
  );
};

export default IconGuide; 