export type MatchProfile = {
  specialty_id: string | null;
  years_experience: number;
  country: string | null;
  license_country: string | null;
} | null;

export type MatchJob = {
  specialty_id: string | null;
  min_experience: number;
  country: string;
  required_license: string | null;
};

/**
 * نسبة التوافق بين الكادر والوظيفة:
 * التخصص 45% · الخبرة 25% · الدولة 20% · الترخيص 10%
 */
export function matchScore(profile: MatchProfile, job: MatchJob): number | null {
  if (!profile) return null;
  let score = 0;

  if (profile.specialty_id && job.specialty_id) {
    score += profile.specialty_id === job.specialty_id ? 45 : 12;
  } else {
    score += 20;
  }

  if (job.min_experience <= 0) score += 25;
  else {
    const ratio = Math.min(profile.years_experience / job.min_experience, 1);
    score += Math.round(ratio * 25);
  }

  if (profile.country && profile.country === job.country) score += 20;
  else if (profile.country) score += 6;

  if (!job.required_license) score += 10;
  else if (profile.license_country && job.country === profile.license_country) score += 10;
  else score += 3;

  return Math.max(5, Math.min(99, score));
}
