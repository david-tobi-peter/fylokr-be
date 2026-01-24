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

export class BaseRepository<T extends ObjectLiteral> extends Repository<T> {
  private getRepository(queryRunner?: QueryRunner): TypeORMRepository<T> {
    if (queryRunner) {
      return queryRunner.manager.getRepository(this.target as new () => T);
    }

    return this.manager.getRepository(this.target as new () => T);
  }

  /**
   * @override
   * @param {Object} options
   * @param {FindOneOptionsWhere<T> | FindOneOptionsWhere<T>[]} options.where
   * @param {FindOptionsRelations<T>} [options.relations]
   * @param {FindOptionsSelect<T>} [options.select]
   * @param {boolean} [options.withDeleted]
   * @param {QueryRunner} [options.queryRunner]
   * @returns {Promise<T | null>}
   */
  override async findOne(options: {
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[];
    relations?: FindOptionsRelations<T>;
    select?: FindOptionsSelect<T>;
    withDeleted?: boolean;
    queryRunner?: QueryRunner;
  }): Promise<T | null> {
    const repo = this.getRepository(options.queryRunner);

    return repo.findOne({
      where: options.where,
      ...(options.relations && { relations: options.relations }),
      ...(options.select && { select: options.select }),
      withDeleted: options.withDeleted ?? false,
    });
  }

  /**
   * @param {Object} options
   * @param {FindOneOptionsWhere<T> | FindOneOptionsWhere<T>[]} options.where
   * @param {FindOptionsRelations<T>} [options.relations]
   * @param {FindOptionsSelect<T>} [options.select]
   * @param {number} [options.limit]
   * @param {number} [options.offset]
   * @param {FindOptionsOrder<T> | FindOptionsOrder<T>} [options.order]
   * @param {boolean} [options.withDeleted]
   * @param {QueryRunner} [options.queryRunner]
   * @returns {Promise<T[]>}
   */
  async findMany(options: {
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[];
    relations?: FindOptionsRelations<T>;
    select?: FindOptionsSelect<T>;
    limit?: number;
    offset?: number;
    order?: FindOptionsOrder<T>;
    withDeleted?: boolean;
    queryRunner?: QueryRunner;
  }): Promise<T[]> {
    const repo = this.getRepository(options.queryRunner);

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

  /**
   * @param {Object} options
   * @param {FindManyOptionsWhere<T> | FindManyOptionsWhere<T>[]} options.where
   * @param {FindOptionsRelations<T>} [options.relations]
   * @param {FindOptionsSelect<T>} [options.select]
   * @param {number} [options.limit]
   * @param {number} [options.offset]
   * @param {FindOptionsOrder<T>} [options.order]
   * @param {boolean} [options.withDeleted]
   * @param {QueryRunner} [options.queryRunner]
   * @returns {Promise<{ data: T[]; total: number }>}
   */
  async findManyWithCount(
    options: {
      where: FindOptionsWhere<T> | FindOptionsWhere<T>[];
      relations?: FindOptionsRelations<T>;
      select?: FindOptionsSelect<T>;
      limit?: number;
      offset?: number;
      order?: FindOptionsOrder<T>;
      withDeleted?: boolean;
      queryRunner?: QueryRunner;
    },
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

  /**
   * @param {Object} options
   * @param {DeepPartial<T>} options.data
   * @param {QueryRunner} [options.queryRunner]
   * @returns {Promise<T>}
   */
  async createRecord(options: {
    data: DeepPartial<T>;
    queryRunner?: QueryRunner;
  }): Promise<T> {
    const repo = this.getRepository(options.queryRunner);
    const entity = repo.create(options.data);
    return repo.save(entity);
  }

  /**
   * @param {Object} options
   * @param {FindOptionsWhere<T>} options.where
   * @param {DeepPartial<T>} options.data
   * @param {boolean} [options.withDeleted]
   * @param {QueryRunner} [options.queryRunner]
   * @returns {Promise<T | null>}
   */
  async updateRecord(options: {
    where: FindOptionsWhere<T>;
    data: DeepPartial<T>;
    withDeleted?: boolean;
    queryRunner?: QueryRunner;
  }): Promise<T | null> {
    const repo = this.getRepository(options.queryRunner);

    const entity = await repo.findOne({
      where: options.where,
      withDeleted: options.withDeleted ?? false,
    });

    if (!entity) return null;

    Object.keys(entity).forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(options.data, key)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entity as any)[key] = (options.data as any)[key];
      }
    });

    return repo.save(entity);
  }

  /**
   * @param {Object} options
   * @param {FindOptionsWhere<T>} options.where
   * @param {QueryRunner} [options.queryRunner]
   * @returns {Promise<boolean>}
   */
  async hardDeleteRecord(options: {
    where: FindOptionsWhere<T>;
    queryRunner?: QueryRunner;
  }): Promise<boolean> {
    const repo = this.getRepository(options.queryRunner);
    const result = await repo.delete(options.where);
    return (result.affected ?? 0) > 0;
  }

  /**
   * @param {Object} options
   * @param {FindOptionsWhere<T> | FindOptionsWhere<T>[]} options.where
   * @param {QueryRunner} [options.queryRunner]
   * @returns {Promise<number>}
   */
  async hardDeleteRecords(options: {
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[];
    queryRunner?: QueryRunner;
  }): Promise<number> {
    const repo = this.getRepository(options.queryRunner);
    const result = await repo.delete(options.where);
    return result.affected ?? 0;
  }

  /**
   * @param {Object} options
   * @param {FindOptionsWhere<T>} options.where
   * @param {QueryRunner} [options.queryRunner]
   * @returns {Promise<T | null>}
   */
  async softDeleteRecord(options: {
    where: FindOptionsWhere<T>;
    queryRunner?: QueryRunner;
  }): Promise<T | null> {
    return this.toggleSoftDelete(options.where, true, options.queryRunner);
  }

  /**
   * @param {Object} options
   * @param {FindOptionsWhere<T> | FindOptionsWhere<T>[]} options.where
   * @param {QueryRunner} [options.queryRunner]
   * @returns {Promise<T[]>}
   */
  async softDeleteRecords(options: {
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[];
    queryRunner?: QueryRunner;
  }): Promise<T[]> {
    return this.toggleManySoftDelete(options.where, true, options.queryRunner);
  }

  /**
   * @param {Object} options
   * @param {FindOptionsWhere<T>} options.where
   * @param {QueryRunner} [options.queryRunner]
   * @returns {Promise<T | null>}
   */
  async restoreRecord(options: {
    where: FindOptionsWhere<T>;
    queryRunner?: QueryRunner;
  }): Promise<T | null> {
    return this.toggleSoftDelete(options.where, false, options.queryRunner);
  }

  /**
   * @param {Object} options
   * @param {FindOptionsWhere<T> | FindOptionsWhere<T>[]} options.where
   * @param {QueryRunner} [options.queryRunner]
   * @returns {Promise<T[]>}
   */
  async restoreRecords(options: {
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[];
    queryRunner?: QueryRunner;
  }): Promise<T[]> {
    return this.toggleManySoftDelete(options.where, false, options.queryRunner);
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
