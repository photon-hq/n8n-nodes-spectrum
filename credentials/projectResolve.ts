export interface DashboardProject {
	id: string;
	name?: string;
	spectrum?: boolean;
	spectrumProjectId?: string;
	projectSecret?: string;
}

const N8N_PROJECT_PREFIX = /^n8n\b/i;

export function pickExistingProject(
	projects: DashboardProject[],
	opts: { projectId?: string; preferredName?: string },
): string | null {
	const wantedId = (opts.projectId ?? '').trim();
	if (wantedId) {
		const found = projects.find((p) => p.id === wantedId || p.spectrumProjectId === wantedId);
		if (found) return found.id;
	}

	const preferredName = (opts.preferredName ?? '').trim();
	const n8nProjects = projects.filter((p) => {
		const name = (p.name ?? '').trim();
		if (!name) return false;
		if (N8N_PROJECT_PREFIX.test(name)) return true;
		return preferredName.length > 0 && name === preferredName;
	});
	if (n8nProjects.length >= 1) {
		return n8nProjects[n8nProjects.length - 1].id;
	}

	return null;
}

export function formatProjectList(projects: DashboardProject[]): string {
	return projects.map((p) => `${p.id}${p.name ? ` (${p.name})` : ''}`).join(', ');
}

export function projectResolutionError(
	projects: DashboardProject[],
	opts: { createIfNone: boolean },
): string {
	if (projects.length === 0) {
		if (opts.createIfNone) return '';
		return 'No Photon projects on this account. Create one at https://app.photon.codes, then Save again.';
	}
	return (
		`Could not pick a single Photon project. Found: ${formatProjectList(projects)}. ` +
		'Paste the Project ID when using manual credentials, or rename one project to start with "n8n".'
	);
}
