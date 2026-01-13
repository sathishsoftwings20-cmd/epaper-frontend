import api from "../api/api";
import axios from "axios";
import type { UserBase } from "./user.api";

export interface EpaperImage {
  _id?: string;
  pageNumber: number;
  imageUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt?: string;
}

export interface EpaperPDF {
  fileUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt?: string;
}

export interface Epaper {
  _id?: string;
  name: string;
  date: string;
  images: EpaperImage[];
  pdf: EpaperPDF | null;
  fileType: "images" | "pdf";
  totalPages: number;
  status: "draft" | "published" | "archived";
  createdAt?: string;
  updatedAt?: string;
  createdBy?: Pick<UserBase, "_id" | "fullName" | "email" | "role">;
  updatedBy?: Pick<UserBase, "_id" | "fullName" | "email" | "role">;
}

export interface CreateEpaperPayload {
  name: string;
  date: string;
  fileType?: "images" | "pdf";
  images?: File[];
  pdf?: File;
}

export interface UpdateEpaperPayload {
  name?: string;
  date?: string;
  status?: string;
  fileType?: "images" | "pdf";
  images?: File[];
  pdf?: File;
  removePDF?: boolean;
  replaceImageId?: string;
}

export interface ReorderImagesPayload {
  imageOrder: string[];
}

export interface EpaperResponse {
  message: string;
  epaper: Epaper;
}

export interface PaginatedResponse {
  epapers: Epaper[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Error helper
function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
      const message = data["message"];
      const error = data["error"];
      if (typeof message === "string") return message;
      if (typeof error === "string") return error;
    }
    return err.message || "Request failed";
  }
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error occurred";
}

/* ----------------------------- API Calls ------------------------------- */

// Create ePaper with either images OR PDF
export async function createEpaper(
  payload: CreateEpaperPayload
): Promise<EpaperResponse> {
  try {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("date", payload.date);
    formData.append("fileType", payload.fileType || "images");
    
    // Append images if provided
    if (payload.images && payload.images.length > 0) {
      payload.images.forEach((image) => {
        formData.append("images", image);
      });
    }
    
    // Append PDF if provided (single file)
    if (payload.pdf) {
      formData.append("pdf", payload.pdf);
    }

    const res = await api.post<EpaperResponse>("/epapers", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

// Get all ePapers with pagination and filters
export async function getAllEpapers(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  status?: string,
  startDate?: string,
  endDate?: string
): Promise<PaginatedResponse> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(status && { status }),
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    const res = await api.get<PaginatedResponse>(`/epapers?${params}`);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

// Get ePaper by ID
export async function getEpaperById(id: string): Promise<Epaper> {
  try {
    const res = await api.get<Epaper>(`/epapers/${id}`);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

// Update ePaper
export async function updateEpaper(
  id: string,
  payload: UpdateEpaperPayload
): Promise<EpaperResponse> {
  try {
    const formData = new FormData();
    
    if (payload.name) formData.append("name", payload.name);
    if (payload.date) formData.append("date", payload.date);
    if (payload.status) formData.append("status", payload.status);
    if (payload.fileType) formData.append("fileType", payload.fileType);
    
    // Append new images if provided
    if (payload.images && payload.images.length > 0) {
      payload.images.forEach((image) => {
        formData.append("images", image);
      });
    }
    
    // Append PDF if provided (single file)
    if (payload.pdf) {
      formData.append("pdf", payload.pdf);
    }
    
    // Handle PDF removal
    if (payload.removePDF) {
      formData.append("removePDF", "true");
    }
    
    // Handle image replacement
    if (payload.replaceImageId) {
      formData.append("replaceImageId", payload.replaceImageId);
    }

    const res = await api.put<EpaperResponse>(`/epapers/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

// Reorder images
export async function reorderEpaperImages(
  id: string,
  imageOrder: string[]
): Promise<{ message: string; images: EpaperImage[] }> {
  try {
    const res = await api.patch(`/epapers/${id}/reorder`, { imageOrder });
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

// Delete ePaper
export async function deleteEpaper(id: string): Promise<{ message: string }> {
  try {
    const res = await api.delete(`/epapers/${id}`);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

// Delete single image from ePaper
export async function deleteEpaperImage(
  epaperId: string,
  imageId: string
): Promise<{ message: string }> {
  try {
    const res = await api.delete(`/epapers/${epaperId}/images/${imageId}`);
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

// Get ePapers by date range
export async function getEpapersByDateRange(
  startDate: string,
  endDate: string
): Promise<Epaper[]> {
  try {
    const res = await api.get<Epaper[]>("/epapers/date-range", {
      params: { startDate, endDate }
    });
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

// Get ePaper by date (PUBLIC – Landing Page)
export async function getEpaperByDate(date: string): Promise<Epaper> {
  try {
    const res = await api.get<Epaper>("/epapers/by-date", {
      params: { date },
    });
    return res.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
}

export default {
  createEpaper,
  getAllEpapers,
  getEpaperById,
  getEpaperByDate,
  updateEpaper,
  reorderEpaperImages,
  deleteEpaper,
  deleteEpaperImage,
  getEpapersByDateRange,
};