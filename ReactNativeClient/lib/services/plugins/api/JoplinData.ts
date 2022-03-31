import Api from 'lib/services/rest/Api';
import { Path } from './types';

/**
 * This module provides access to the Joplin data API: https://joplinapp.org/api/references/rest_api/
 * This is the main way to retrieve data, such as notes, notebooks, tags, etc.
 * or to update them or delete them.
 *
 * This is also what you would use to search notes, via the `search` endpoint.
 *
 * [View the demo plugin](https://github.com/laurent22/joplin/CliClient/tests/support/plugins/simple)
 *
 * In general you would use the methods in this class as if you were using a REST API. There are four methods that map to GET, POST, PUT and DELETE calls.
 * And each method takes these parameters:
 *
 * * `path`: This is an array that represents the path to the resource in the form `["resouceName", "resourceId", "resourceLink"]` (eg. ["tags", ":id", "notes"]). The "resources" segment is the name of the resources you want to access (eg. "notes", "folders", etc.). If not followed by anything, it will refer to all the resources in that collection. The optional "resourceId" points to a particular resources within the collection. Finally, an optional "link" can be present, which links the resource to a collection of resources. This can be used in the API for example to retrieve all the notes associated with a tag.
 * * `query`: (Optional) The query parameters. In a URL, this is the part after the question mark "?". In this case, it should be an object with key/value pairs.
 * * `data`: (Optional) Applies to PUT and POST calls only. The request body contains the data you want to create or modify, for example the content of a note or folder.
 * * `files`: (Optional) Used to create new resources and associate them with files.
 *
 * Please refer to the [Joplin API documentation](https://joplinapp.org/api/references/rest_api/) for complete details about each call. As the plugin runs within the Joplin application **you do not need an authorisation token** to use this API.
 *
 * For example:
 *
 * ```typescript
 * // Get a note ID, title and body
 * const noteId = 'some_note_id';
 * const note = await joplin.data.get(['notes', noteId], { fields: ['id', 'title', 'body'] });
 *
 * // Get all folders
 * const folders = await joplin.data.get(['folders']);
 *
 * // Set the note body
 * await joplin.data.put(['notes', noteId], null, { body: "New note body" });
 *
 * // Create a new note under one of the folders
 * await joplin.data.post(['notes'], null, { body: "my new note", title: "some title", parent_id: folders[0].id });
 * ```
 */
export default class JoplinData {

	private api_: any = new Api();
	private pathSegmentRegex_:RegExp;

	private serializeApiBody(body: any) {
		if (typeof body !== 'string') { return JSON.stringify(body); }
		return body;
	}

	private pathToString(path:Path):string {
		if (!this.pathSegmentRegex_) {
			this.pathSegmentRegex_ = /^([a-z0-9]+)$/;
		}

		if (!Array.isArray(path)) throw new Error(`Path must be an array: ${JSON.stringify(path)}`);
		if (path.length < 1) throw new Error(`Path must have at least one element: ${JSON.stringify(path)}`);
		if (path.length > 3) throw new Error(`Path must have no more than 3 elements: ${JSON.stringify(path)}`);

		for (const p of path) {
			if (!this.pathSegmentRegex_.test(p)) throw new Error(`Path segments must only contain lowercase letters and digits: ${JSON.stringify(path)}`);
		}

		return path.join('/');
	}

	async get(path: Path, query: any = null) {
		return this.api_.route('GET', this.pathToString(path), query);
	}

	async post(path: Path, query: any = null, body: any = null, files: any[] = null) {
		return this.api_.route('POST', this.pathToString(path), query, this.serializeApiBody(body), files);
	}

	async put(path: Path, query: any = null, body: any = null, files: any[] = null) {
		return this.api_.route('PUT', this.pathToString(path), query, this.serializeApiBody(body), files);
	}

	async delete(path: Path, query: any = null) {
		return this.api_.route('DELETE', this.pathToString(path), query);
	}
}
