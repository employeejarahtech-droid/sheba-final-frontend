import { baseApi } from "@/store/baseApi";
import type { Settings } from "@/types/types";

type SettingsResponse = {
  status: boolean;
  message: string;
  data: Settings;
};

export const settingsApiService = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSettingsInfo: builder.query<SettingsResponse, void>({
      query: () => ({
        url: `/settings/company/profile`,
        method: "GET",
      }),
      providesTags: ["Settings"],
    }),
    updateSettingsInfo: builder.mutation<SettingsResponse, Partial<Settings>>({
      query: (body) => ({
        url: `/settings/company/profile`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const {
  useGetSettingsInfoQuery,
  useUpdateSettingsInfoMutation
} = settingsApiService;
