import type {
  DeepPartial,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  ObjectLiteral,
  QueryRunner,
  Repository as TypeORMRepository,
} from "typeorm";
import { Repository } from "typeorm";
import { getUTCDateTime } from "#/shared/utils";

interface SoftDeletable {
  deletedAt: Date | null;
}

interface FindOneOptions<T> {
  where: FindOptionsWhere<T> | FindOptionsWhere<T>[];
  relations?: FindOptionsRelations<T>;
  select?: FindOptionsSelect<T>;
  withDeleted?: boolean;
}

interface FindManyOptions<T> extends FindOneOptions<T> {
  offset?: number;
  limit?: number;
  order?: FindOptionsOrder<T>;
}

export class BaseRepository<T extends ObjectLiteral> extends Repository<T> {
  private getRepository(queryRunner?: QueryRunner): TypeORMRepository<T> {
    if (queryRunner) {
      return queryRunner.manager.getRepository(this.target as new () => T);
    }

    return this.manager.getRepository(this.target as new () => T);
  }

  async findOne(
    options: FindOneOptions<T>,
    queryRunner?: QueryRunner,
  ): Promise<T | null> {
    const repo = this.getRepository(queryRunner);

    return repo.findOne({
      where: options.where,
      ...(options.relations && { relations: options.relations }),
      ...(options.select && { select: options.select }),
      withDeleted: options.withDeleted ?? false,
    });
  }

  async findMany(
    options: FindManyOptions<T>,
    queryRunner?: QueryRunner,
  ): Promise<T[]> {
    const repo = this.getRepository(queryRunner);

    return repo.find({
      where: options.where,
      ...(options.relations && { relations: options.relations }),
      ...(options.select && { select: options.select }),
      ...(options.limit !== undefined && { take: options.limit }),
      ...(options.offset !== undefined && { skip: options.offset }),
      ...(options.order && { order: options.order }),
      withDeleted: options.withDeleted ?? false,
    });
  }

  async findManyWithCount(
    options: FindManyOptions<T>,
    queryRunner?: QueryRunner,
  ): Promise<{ data: T[]; total: number }> {
    const repo = this.getRepository(queryRunner);

    const [data, total] = await repo.findAndCount({
      where: options.where,
      ...(options.relations && { relations: options.relations }),
      ...(options.select && { select: options.select }),
      ...(options.limit !== undefined && { take: options.limit }),
      ...(options.offset !== undefined && { skip: options.offset }),
      ...(options.order && { order: options.order }),
      withDeleted: options.withDeleted ?? false,
    });

    return { data, total };
  }

  async createRecord(
    data: DeepPartial<T>,
    queryRunner?: QueryRunner,
  ): Promise<T> {
    const repo = this.getRepository(queryRunner);
    const entity = repo.create(data);
    return repo.save(entity);
  }

  async updateRecord(
    where: FindOptionsWhere<T>,
    data: DeepPartial<T>,
    options?: { withDeleted?: boolean },
    queryRunner?: QueryRunner,
  ): Promise<T | null> {
    const repo = this.getRepository(queryRunner);

    const entity = await repo.findOne({
      where,
      withDeleted: options?.withDeleted ?? false,
    });

    if (!entity) return null;

    Object.keys(entity).forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entity as any)[key] = (data as any)[key];
      }
    });

    return repo.save(entity);
  }

  async hardDeleteRecord(
    where: FindOptionsWhere<T>,
    queryRunner?: QueryRunner,
  ): Promise<boolean> {
    const repo = this.getRepository(queryRunner);
    const result = await repo.delete(where);
    return (result.affected ?? 0) > 0;
  }

  async hardDeleteRecords(
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
    queryRunner?: QueryRunner,
  ): Promise<number> {
    const repo = this.getRepository(queryRunner);
    const result = await repo.delete(where);
    return result.affected ?? 0;
  }

  async softDeleteRecord(
    where: FindOptionsWhere<T>,
    queryRunner?: QueryRunner,
  ): Promise<T | null> {
    return this.toggleSoftDelete(where, true, queryRunner);
  }

  async softDeleteRecords(
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
    queryRunner?: QueryRunner,
  ): Promise<T[]> {
    return this.toggleManySoftDelete(where, true, queryRunner);
  }

  async restoreRecord(
    where: FindOptionsWhere<T>,
    queryRunner?: QueryRunner,
  ): Promise<T | null> {
    return this.toggleSoftDelete(where, false, queryRunner);
  }

  async restoreRecords(
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
    queryRunner?: QueryRunner,
  ): Promise<T[]> {
    return this.toggleManySoftDelete(where, false, queryRunner);
  }

  private async toggleSoftDelete(
    where: FindOptionsWhere<T>,
    isDelete: boolean,
    queryRunner?: QueryRunner,
  ): Promise<T | null> {
    const repo = this.getRepository(queryRunner);

    const entity = await repo.findOne({ where, withDeleted: !isDelete });
    if (!entity) return null;

    if ("deletedAt" in entity) {
      (entity as T & SoftDeletable).deletedAt = isDelete
        ? getUTCDateTime()
        : null;
      return repo.save(entity);
    }

    throw new Error(
      `Entity ${String(this.target)} does not support soft deletion`,
    );
  }

  private async toggleManySoftDelete(
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[],
    isDelete: boolean,
    queryRunner?: QueryRunner,
  ): Promise<T[]> {
    const repo = this.getRepository(queryRunner);

    const entities = await repo.find({ where, withDeleted: !isDelete });
    if (entities.length === 0) return [];

    const first = entities[0];
    if (!first || !("deletedAt" in first))
      throw new Error(
        `Entity ${String(this.target)} does not support soft deletion`,
      );

    const deletedAt = isDelete ? getUTCDateTime() : null;
    entities.forEach((entity) => {
      (entity as T & SoftDeletable).deletedAt = deletedAt;
    });

    return repo.save(entities);
  }
}
