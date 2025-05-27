import React, { createContext, useContext } from 'react';

// Define the shape of the Memberstack instance based on what we expect to use.
// This might need to be expanded as you use more Memberstack features.
// For now, we know we need loginMemberEmailPassword.
// You might need to import Memberstack types if they are available and provide more detail.
interface MemberstackInstance {
  // Example: Adjust based on actual method signature from Memberstack docs/types
  loginMemberEmailPassword: (credentials: { email: string; password?: string; metadata?: any; }) => Promise<{
    data?: { 
      member?: any; // Replace 'any' with a more specific Member type if available
      token?: string; 
      firstFactor?: string; 
      isLoginLink?: boolean;
    } | null;
    error?: { 
      type?: string; 
      message?: string; 
      code?: string; 
      statusCode?: number;
    } | null;
  }>;
  // Add other Memberstack methods here as needed, e.g.:
  // getMember: () => Promise<{ data: { member: any } | null, error: any | null }>;
  // logout: () => Promise<void>;
  // openModal: (type: string) => void; 
}

// Create the context with a default undefined value,
// consumers must be descendants of a Provider.
const MemberstackContext = createContext<MemberstackInstance | undefined>(undefined);

// Custom hook to use the Memberstack context
export const useMemberstack = (): MemberstackInstance => {
  const context = useContext(MemberstackContext);
  if (context === undefined) {
    throw new Error('useMemberstack must be used within a MemberstackProvider');
  }
  return context;
};

// Provider component props
interface MemberstackProviderProps {
  children: React.ReactNode;
  instance: MemberstackInstance;
}

export const MemberstackProvider: React.FC<MemberstackProviderProps> = ({ children, instance }) => {
  return (
    <MemberstackContext.Provider value={instance}>
      {children}
    </MemberstackContext.Provider>
  );
};

// Re-export the raw context if needed, though useMemberstack is preferred.
export default MemberstackContext; 