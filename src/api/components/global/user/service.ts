import { bind } from 'decko';
import { Like, Repository, FindConditions, getManager, FindManyOptions, FindOneOptions } from 'typeorm';

import { CacheService } from '@services/cache';

import { User } from './model';

export class UserService {
	private readonly defaultRelations: string[] = ['userRole', 'assignee', 'tasksWatched'];

	private readonly cacheService: CacheService = new CacheService();

	private readonly repo: Repository<User> = getManager().getRepository(User);

	/**
	 * Read all users from db
	 *
	 * @param options Find options
	 * @param cached Read users from cache
	 * @returns Returns an array of users
	 */
	@bind
	public readUsers(options: FindManyOptions<User> = {}, cached: boolean = false): Promise<User[]> {
		try {
			if (Object.keys(options).length) {
				return this.repo.find({
					relations: this.defaultRelations,
					...options
				});
			}

			if (cached) {
				return this.cacheService.get('users', this.readUsers);
			}

			return this.repo.find({
				relations: this.defaultRelations
			});
		} catch (err) {
			throw new Error(err);
		}
	}

	/**
	 * Read users from db by username
	 *
	 * @param username Username to search for
	 * @returns Returns an array of users
	 */
	@bind
	public readUsersByUsername(username: string): Promise<User[]> {
		try {
			let where: FindConditions<User> = {};

			if (username) {
				const [firstname, lastname] = username.split(' ');

				if (firstname) {
					where = { ...where, firstname: Like(`%${firstname}%`) };
				}

				if (lastname) {
					where = { ...where, lastname: Like(`%${lastname}%`) };
				}
			}

			return this.readUsers({ where });
		} catch (err) {
			throw new Error(err);
		}
	}

	/**
	 * Read a certain user from db
	 *
	 * @param options Find options
	 * @returns Returns a single user
	 */
	@bind
	public readUser(options: FindOneOptions<User> = {}): Promise<User | undefined> {
		try {
			return this.repo.findOne({
				relations: this.defaultRelations,
				...options
			});
		} catch (err) {
			throw new Error(err);
		}
	}

	/**
	 * Save new or updated u ser to db
	 *
	 * @param user User to save
	 * @returns Returns saved user
	 */
	@bind
	public async saveUser(user: User): Promise<User> {
		try {
			const newUser: User = await this.repo.save(user);

			// Clear user cache
			this.cacheService.delete('user');

			return newUser;
		} catch (err) {
			throw new Error(err);
		}
	}

	/**
	 * Delete user from db
	 *
	 * @param user User to delete
	 * @returns Returns deleted user
	 */
	@bind
	public async deleteUser(user: User): Promise<User> {
		try {
			const deletedUser = await this.repo.remove(user);

			// Clear user cache
			this.cacheService.delete('user');

			return deletedUser;
		} catch (err) {
			throw new Error(err);
		}
	}
}