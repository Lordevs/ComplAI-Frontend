'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { API_ROUTES } from '@/constants/apiRoutes';
import { useUserContext } from '@/contexts/user-context';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Building, Eye, EyeOff, UserIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';

import apiCaller from '@/config/apiCaller';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  ProfileFormFields,
  profileSchema,
  type ProfileFormValues,
} from './profile-form-fields';
import ProfileImageUploader from './profile-uploader';

interface ProfileFormProps {
  type?: string;
}
export default function ProfileForm({ type }: ProfileFormProps) {
  const { user, setUser, refresh } = useUserContext();

  const [isEditable, setIsEditable] = useState<boolean>(type === 'new');
  const [showUserId, setShowUserId] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isCompanyLogoUploaderOpen, setIsCompanyLogoUploaderOpen] =
    useState(false);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);

  const { control, handleSubmit, reset, watch } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      id: '',
      username: '',
      email: '',
      phoneNumber: '',
      jobTitle: '',
      organization_name: '',
      creationDate: new Date(),
    },
  });

  const userId = watch('id');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiCaller(
          API_ROUTES.USER.GET_USER_DATA,
          'GET',
          {},
          {},
          true,
          'json'
        );
        const data = response.data;
        const fetchedDate = new Date(data.creationDate);
        const validDate = isNaN(fetchedDate.getTime())
          ? new Date()
          : fetchedDate;

        reset(
          {
            id: String(data.id || ''),
            username: data.username || '',
            email: data.email || '',
            phoneNumber: data.phone_number || '',
            jobTitle: data.job_title || '',
            creationDate: validDate,
            organization_name: data.organization_name || '',
          },
          { keepDefaultValues: false }
        );
        setProfileImage(data.profile_picture);
        setCompanyLogo(data.company_picture);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    fetchProfile();
  }, [reset, refresh]);

  const toggleEdit = () => setIsEditable((prev) => !prev);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const response = await apiCaller(
        API_ROUTES.USER.GET_USER_DATA,
        'PUT',
        {
          username: data.username,
          email: data.email,
          phone_number: data.phoneNumber,
          job_title: data.jobTitle,
          organization_name: data.organization_name,
        },
        {},
        true,
        'json'
      );
      setUser(response.data);
      refresh();
      setIsEditable(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleImageSave = async (croppedImage: string) => {
    try {
      // Convert base64 string to Blob using fetch
      const blob = await fetch(croppedImage).then((res) => res.blob());
      console.log('Blob:', blob);

      // Create a new File from the Blob
      const file = new File([blob], 'profile.png', { type: 'image/png' });
      console.log('File:', file);

      // Build FormData
      const formData = new FormData();
      formData.append('profile_picture', file);

      // Debug: log FormData entries
      for (const [key, value] of formData.entries()) {
        console.log('FormData:', key, value);
      }

      const response = await axios.post(
        process.env.NEXT_PUBLIC_BACKEND_URL +
          API_ROUTES.USER.UPDATE_PROFILE_IMAGE,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );
      console.log('Upload response:', response.data);
      setUser((prev) => {
        if (!prev) return prev;
        return { ...prev, profile_picture: croppedImage };
      });
      refresh();
      setProfileImage(croppedImage);
    } catch (error) {
      console.error('Failed to update profile image:', error);
    }
  };
  const handleCompanyLogoSave = async (croppedImage: string) => {
    try {
      const blob = await fetch(croppedImage).then((res) => res.blob());
      const file = new File([blob], 'company_logo.png', { type: 'image/png' });
      const formData = new FormData();
      formData.append('company_picture', file);

      const response = await axios.post(
        process.env.NEXT_PUBLIC_BACKEND_URL +
          API_ROUTES.USER.ADD_COMPANY_PICTURE,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );
      console.log('Upload response:', response.data);
      setUser((prev) => {
        if (!prev) return prev;
        return { ...prev, company_picture: croppedImage };
      });
      refresh();
      setCompanyLogo(croppedImage);
    } catch (error) {
      console.error('Failed to update company logo:', error);
    }
  };

  // const handleImageSave = async (croppedImage: string) => {
  //   try {
  //     const blob = await fetch(croppedImage).then((res) => res.blob());
  //     console.log('Blob:', blob);

  //     // Create a new File from the Blob with explicit MIME type 'image/png'
  //     const file = new File([blob], 'profile.png', { type: 'image/png' });
  //     console.log('File:', file);

  //     // Append the file to a FormData object
  //     const formData = new FormData();
  //     formData.append('profile_picture', file);

  //     // Debug: log FormData entries
  //     for (const [key, value] of formData.entries()) {
  //       console.log('FormData:', key, value);
  //     }

  //     // Send the FormData payload to your API
  //     await apiCaller(API_ROUTES.USER.UPDATE_PROFILE_IMAGE, 'POST', formData, {}, true, 'formdata');

  //     // Update user context and local state with the new profile image
  //     setUser((prev) => {
  //       if (!prev) return prev;
  //       return { ...prev, profile_picture: croppedImage };
  //     });
  //     refresh();
  //     setProfileImage(croppedImage);
  //   } catch (error) {
  //     console.error('Failed to update profile image:', error);
  //   }
  // };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="p-6 pb-20 bg-white shadow-md rounded-xl w-full mx-auto"
    >
      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        {/* Responsive Profile Image Container */}
        <div
          onClick={() => setIsUploaderOpen(true)}
          className="relative aspect-square w-16 md:w-20 lg:w-24 group overflow-hidden rounded-full cursor-pointer"
        >
          {profileImage || user?.profile_picture ? (
            <Image
              src={profileImage || user!.profile_picture!}
              alt="Profile Avatar"
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <UserIcon className="h-[100%] w-[100%] text-gray-400" />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-white text-sm font-medium">Change</span>
          </div>
        </div>

        <div className="relative">
          <h1 className="text-xl md:text-3xl font-bold">
            {user?.username || 'Full Name'}
          </h1>
        </div>

        <div className="mt-2 text-gray-500 relative cursor-pointer flex items-center gap-2">
          <span className={showUserId ? 'text-black' : 'blur-sm'}>
            {showUserId ? `UserID: ${userId}` : 'UserID: ******'}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  className="text-gray-700 hover:text-black relative p-0 h-fit bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowUserId((prev) => !prev);
                  }}
                >
                  {showUserId ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs bg-gray-800 p-2 py-1 text-white">
                {showUserId ? 'Hide ID' : 'Reveal ID'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="md:ml-auto flex items-center gap-4">
          {/* Company Logo Image Container */}
          <div className="flex flex-col items-center">
            <div
              onClick={() => setIsCompanyLogoUploaderOpen(true)}
              className="relative aspect-square w-16 md:w-20 lg:w-24 group overflow-hidden rounded-full cursor-pointer bg-gray-50 border-2 border-dashed border-gray-200 hover:border-blue-400 transition-colors"
            >
              {companyLogo || user?.company_picture ? (
                <Image
                  src={companyLogo || user!.company_picture!}
                  alt="Company Logo"
                  fill
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full w-full">
                  <Building className="h-8 w-8 text-gray-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-white text-sm font-medium text-center px-1">
                  Company Logo
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mt-1">
              Company Logo
            </span>
          </div>

          <Button
            type="button"
            variant={isEditable ? 'outline' : 'default'}
            onClick={
              isEditable
                ? () => {
                    reset();
                    toggleEdit();
                  }
                : toggleEdit
            }
          >
            {isEditable ? 'Cancel' : 'Edit Info'}
          </Button>
          {isEditable && <Button type="submit">Save Changes</Button>}
        </div>
      </div>

      <ProfileFormFields control={control} isEditable={isEditable} />

      {/* Profile Image Uploader Dialog */}
      <ProfileImageUploader
        oldImage={profileImage || '/default-profile.png'}
        open={isUploaderOpen}
        onOpenChange={setIsUploaderOpen}
        onSave={handleImageSave}
      />

      <ProfileImageUploader
        oldImage={companyLogo || '/default-company.png'}
        open={isCompanyLogoUploaderOpen}
        onOpenChange={setIsCompanyLogoUploaderOpen}
        onSave={handleCompanyLogoSave}
        title="Update Company Logo"
        description="Upload and crop your company logo to display on your reports."
      />
    </form>
  );
}
