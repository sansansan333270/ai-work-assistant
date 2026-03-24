import { Injectable } from '@nestjs/common'
import { eq, desc } from 'drizzle-orm'
import { db } from '@/database'
import { skills, NewSkill, Skill } from '@/database/schema'

@Injectable()
export class SkillsService {
  async findAll(userId: string = 'default-user'): Promise<Skill[]> {
    return await db.select().from(skills).where(eq(skills.userId, userId)).orderBy(desc(skills.createdAt))
  }

  async findOne(id: number, userId: string = 'default-user'): Promise<Skill | undefined> {
    const result = await db.select().from(skills).where(eq(skills.id, id)).limit(1)
    const skill = result[0]
    if (skill && skill.userId !== userId) {
      return undefined
    }
    return skill
  }

  async create(createSkillDto: Omit<NewSkill, 'id' | 'createdAt' | 'updatedAt'>): Promise<Skill> {
    const result = await db.insert(skills).values(createSkillDto).returning()
    return result[0]
  }

  async update(id: number, updateSkillDto: Partial<Omit<NewSkill, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>, userId: string = 'default-user'): Promise<Skill | undefined> {
    const existing = await this.findOne(id, userId)
    if (!existing) {
      return undefined
    }
    const result = await db
      .update(skills)
      .set({ ...updateSkillDto, updatedAt: new Date() })
      .where(eq(skills.id, id))
      .returning()
    return result[0]
  }

  async remove(id: number, userId: string = 'default-user'): Promise<boolean> {
    const existing = await this.findOne(id, userId)
    if (!existing) {
      return false
    }
    await db.delete(skills).where(eq(skills.id, id))
    return true
  }

  async incrementUsage(id: number, userId: string = 'default-user'): Promise<Skill | undefined> {
    const existing = await this.findOne(id, userId)
    if (!existing) {
      return undefined
    }
    const result = await db
      .update(skills)
      .set({ usageCount: (existing.usageCount ?? 0) + 1, updatedAt: new Date() })
      .where(eq(skills.id, id))
      .returning()
    return result[0]
  }
}
