import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CreditsData } from "@/lib/credits";

interface CreditsState extends Partial<CreditsData> {
  isLoading: boolean;
  error: string | null;
}

const initialState: CreditsState = {
  templateCredits: undefined,
  aiPromptCredits: undefined,
  planType: undefined,
  limit: undefined,
  canRender: undefined,
  canUseAiPrompt: undefined,
  isLoading: true,
  error: null,
};

const creditsSlice = createSlice({
  name: "credits",
  initialState,
  reducers: {
    setCredits: (state, action: PayloadAction<CreditsData>) => {
      state.templateCredits = action.payload.templateCredits;
      state.aiPromptCredits = action.payload.aiPromptCredits;
      state.planType = action.payload.planType;
      state.limit = action.payload.limit;
      state.canRender = action.payload.canRender;
      state.canUseAiPrompt = action.payload.canUseAiPrompt;
      state.isLoading = false;
      state.error = null;
    },
    updateCredits: (state, action: PayloadAction<number>) => {
      state.templateCredits = action.payload;
      state.canRender = action.payload > 0;
    },
    setCreditsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setCreditsError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearCredits: (state) => {
      state.templateCredits = undefined;
      state.aiPromptCredits = undefined;
      state.planType = undefined;
      state.limit = undefined;
      state.canRender = undefined;
      state.canUseAiPrompt = undefined;
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  setCredits,
  updateCredits,
  setCreditsLoading,
  setCreditsError,
  clearCredits,
} = creditsSlice.actions;
export default creditsSlice.reducer;
