export class CreateSkillDto {
  name: string
  description?: string
  prompt: string
  category?: string
  icon?: string
  isPublic?: boolean
  userId?: string
}

export class UpdateSkillDto {
  name?: string
  description?: string
  prompt?: string
  category?: string
  icon?: string
  isPublic?: boolean
}
