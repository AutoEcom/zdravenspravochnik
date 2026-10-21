export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PublishStatus = "draft" | "published" | "archived"

export type ReviewStatus = "pending" | "published" | "rejected"

export type UserRole = "patient" | "doctor" | "facility_admin" | "admin"

export type ClaimTargetType = "doctor" | "facility"

export type ClaimStatus = "pending" | "approved" | "rejected"

export type FacilityType =
  | "hospital"
  | "clinic"
  | "practice"
  | "laboratory"
  | "pharmacy"
  | "other"

export type DaySchedule = {
  closed: boolean
  open: string | null
  close: string | null
}

export type WorkingHours = {
  monday?: DaySchedule
  tuesday?: DaySchedule
  wednesday?: DaySchedule
  thursday?: DaySchedule
  friday?: DaySchedule
  saturday?: DaySchedule
  sunday?: DaySchedule
}

export type City = {
  id: string
  name: string
  slug: string
  region: string | null
  created_at: string
  updated_at: string
}

export type Specialty = {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole
  phone: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Doctor = {
  id: string
  profile_id: string | null
  slug: string
  full_name: string
  title: string | null
  bio: string | null
  short_description: string | null
  photo_url: string | null
  phone: string | null
  email: string | null
  website: string | null
  address: string | null
  specialties: string[]
  cities: string[]
  status: PublishStatus
  is_featured: boolean
  is_premium: boolean
  accepts_nhif: boolean
  accepts_children: boolean
  online_consultation: boolean
  is_claimed: boolean
  claimed_by: string | null
  rating: number
  review_count: number
  working_hours: WorkingHours
  source: string | null
  created_at: string
  updated_at: string
}

export type Facility = {
  id: string
  slug: string
  name: string
  facility_type: FacilityType
  description: string | null
  short_description: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  photo_url: string | null
  specialties: string[]
  cities: string[]
  status: PublishStatus
  is_featured: boolean
  is_premium: boolean
  accepts_nhif: boolean
  accepts_children: boolean
  online_consultation: boolean
  is_claimed: boolean
  claimed_by: string | null
  rating: number
  review_count: number
  working_hours: WorkingHours
  source: string | null
  created_at: string
  updated_at: string
}

export type ClaimRequest = {
  id: string
  user_id: string
  target_type: ClaimTargetType
  target_id: string
  email: string
  status: ClaimStatus
  email_verified: boolean
  code_hash: string | null
  code_expires_at: string | null
  created_at: string
}

export type FacilityDoctor = {
  id: string
  facility_id: string
  doctor_id: string
  position: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
}

export type Article = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  cover_url: string | null
  cover_image_url: string | null
  author_id: string | null
  status: PublishStatus
  published_at: string | null
  created_at: string
  updated_at: string
}

export type Review = {
  id: string
  doctor_id: string | null
  facility_id: string | null
  author_id: string | null
  rating: number
  comment: string | null
  status: ReviewStatus
  created_at: string
  updated_at: string
}

export type CityInsert = {
  id?: string
  name: string
  slug: string
  region?: string | null
  created_at?: string
  updated_at?: string
}

export type SpecialtyInsert = {
  id?: string
  name: string
  slug: string
  description?: string | null
  created_at?: string
  updated_at?: string
}

export type ProfileInsert = {
  id: string
  email?: string | null
  full_name?: string | null
  role?: UserRole
  phone?: string | null
  avatar_url?: string | null
  created_at?: string
  updated_at?: string
}

export type DoctorInsert = {
  id?: string
  profile_id?: string | null
  slug: string
  full_name: string
  title?: string | null
  bio?: string | null
  short_description?: string | null
  photo_url?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  address?: string | null
  specialties?: string[]
  cities?: string[]
  status?: PublishStatus
  is_featured?: boolean
  is_premium?: boolean
  accepts_nhif?: boolean
  accepts_children?: boolean
  online_consultation?: boolean
  is_claimed?: boolean
  claimed_by?: string | null
  rating?: number
  review_count?: number
  working_hours?: WorkingHours
  source?: string | null
  created_at?: string
  updated_at?: string
}

export type FacilityInsert = {
  id?: string
  slug: string
  name: string
  facility_type?: FacilityType
  description?: string | null
  short_description?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  photo_url?: string | null
  specialties?: string[]
  cities?: string[]
  status?: PublishStatus
  is_featured?: boolean
  is_premium?: boolean
  accepts_nhif?: boolean
  accepts_children?: boolean
  online_consultation?: boolean
  is_claimed?: boolean
  claimed_by?: string | null
  rating?: number
  review_count?: number
  working_hours?: WorkingHours
  source?: string | null
  created_at?: string
  updated_at?: string
}

export type ClaimRequestInsert = {
  id?: string
  user_id: string
  target_type: ClaimTargetType
  target_id: string
  email: string
  status?: ClaimStatus
  email_verified?: boolean
  code_hash?: string | null
  code_expires_at?: string | null
  created_at?: string
}

export type FacilityDoctorInsert = {
  id?: string
  facility_id: string
  doctor_id: string
  position?: string | null
  is_primary?: boolean
  created_at?: string
  updated_at?: string
}

export type ArticleInsert = {
  id?: string
  slug: string
  title: string
  excerpt?: string | null
  content?: string
  cover_url?: string | null
  cover_image_url?: string | null
  author_id?: string | null
  status?: PublishStatus
  published_at?: string | null
  created_at?: string
  updated_at?: string
}

export type ReviewInsert = {
  id?: string
  doctor_id?: string | null
  facility_id?: string | null
  author_id?: string | null
  rating: number
  comment?: string | null
  status?: ReviewStatus
  created_at?: string
  updated_at?: string
}

export type CityUpdate = Partial<CityInsert>
export type SpecialtyUpdate = Partial<SpecialtyInsert>
export type ProfileUpdate = Partial<ProfileInsert>
export type DoctorUpdate = Partial<DoctorInsert>
export type FacilityUpdate = Partial<FacilityInsert>
export type FacilityDoctorUpdate = Partial<FacilityDoctorInsert>
export type ClaimRequestUpdate = Partial<ClaimRequestInsert>
export type ArticleUpdate = Partial<ArticleInsert>
export type ReviewUpdate = Partial<ReviewInsert>

type Relationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}

type Table<
  Row extends Record<string, unknown>,
  Insert extends Record<string, unknown>,
  Update extends Record<string, unknown>,
  Relationships extends Relationship[] = [],
> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: Relationships
}

export type Database = {
  public: {
    Tables: {
      cities: Table<
        City,
        CityInsert,
        CityUpdate,
        []
      >
      specialties: Table<
        Specialty,
        SpecialtyInsert,
        SpecialtyUpdate,
        []
      >
      profiles: Table<
        Profile,
        ProfileInsert,
        ProfileUpdate,
        [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      >
      doctors: Table<
        Doctor,
        DoctorInsert,
        DoctorUpdate,
        [
          {
            foreignKeyName: "doctors_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      >
      facilities: Table<Facility, FacilityInsert, FacilityUpdate, []>
      facility_doctors: Table<
        FacilityDoctor,
        FacilityDoctorInsert,
        FacilityDoctorUpdate,
        [
          {
            foreignKeyName: "facility_doctors_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_doctors_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      >
      articles: Table<
        Article,
        ArticleInsert,
        ArticleUpdate,
        [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      >
      claim_requests: Table<
        ClaimRequest,
        ClaimRequestInsert,
        ClaimRequestUpdate,
        [
          {
            foreignKeyName: "claim_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      >
      reviews: Table<
        Review,
        ReviewInsert,
        ReviewUpdate,
        [
          {
            foreignKeyName: "reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      >
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
