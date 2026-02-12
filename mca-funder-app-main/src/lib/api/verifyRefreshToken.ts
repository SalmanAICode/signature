// // lib/api/auth/verifyRefreshToken.ts
// import { env } from '@/config/env';

// export async function verifyRefreshToken(): Promise<boolean> {
//     try {
//       const response = await fetch(
//         `${env.api.baseUrl}${env.api.endpoints.syndicator.refresh}`,
//         {
//           method: 'POST',
//           credentials: 'include',
//         }
//       );
  
//       return response.ok;
//     } catch (error) {
//       return false;
//     }
// }