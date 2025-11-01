import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "../api/apiSlice";
import { materialApiSlice } from "../api/materials/materialSlice";
import { studentExamApiSlice } from "../api/student/studentExamApiSlice";
import { questionApiSlice } from "../api/admin/questionApiSlice";
import { examApiSlice } from "../api/exam/examApiSlice";

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    [materialApiSlice.reducerPath]: materialApiSlice.reducer,
    [studentExamApiSlice.reducerPath]: studentExamApiSlice.reducer,
    [questionApiSlice.reducerPath]: questionApiSlice.reducer,
    [examApiSlice.reducerPath]: examApiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      apiSlice.middleware,
      materialApiSlice.middleware,
      studentExamApiSlice.middleware,
      questionApiSlice.middleware,
      examApiSlice.middleware
    ),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
