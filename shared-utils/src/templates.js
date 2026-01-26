/**
 * Template utilities for consistent documentation generation
 */

/**
 * Generates a standard README.md template
 * @param {object} params - Template parameters
 * @returns {string} README content
 */
export function generateReadmeTemplate({ name, description, installation, usage, features, configuration, examples }) {
  const title = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  let template = `# ${title}

${description}

## Installation

\`\`\`
${installation}
\`\`\`

## Usage

${usage}

`;

  if (features && features.length > 0) {
    template += `## Features

${features.map(f => `- ${f}`).join('\n')}

`;
  }

  if (configuration) {
    template += `## Configuration

${configuration}

`;
  }

  if (examples) {
    template += `## Examples

${examples}

`;
  }

  template += `---

## Author

[cbuntingde](https://github.com/cbuntingde)

## License

MIT
`;

  return template;
}

/**
 * Generates a standardized command template
 * @param {object} params - Command parameters
 * @returns {string} Command markdown content
 */
export function generateCommandTemplate({ name, description, parameters, examples, notes }) {
  let template = `# ${name}

${description}

## Parameters

`;

  if (parameters && parameters.length > 0) {
    template += parameters.map(p => `| ${p.name} | ${p.type} | ${p.required ? 'Yes' : 'No'} | ${p.description} |`).join('\n');
    template += '\n|------|---------|---------|---------|\n';
  } else {
    template += 'No parameters required.\n';
  }

  template += `
## Usage

${examples.map(e => `### ${e.title}

\`\`\`
${e.code}
\`\`\`
`).join('\n')}`;

  if (notes && notes.length > 0) {
    template += `

## Notes

${notes.map(n => `- ${n}`).join('\n')}`;
  }

  return template;
}

/**
 * Generates a standardized agent template
 * @param {object} params - Agent parameters
 * @returns {string} Agent markdown content
 */
export function generateAgentTemplate({ name, description, capabilities, workflow, outputFormat }) {
  let template = `# ${name}

${description}

## Capabilities

${capabilities.map(c => `- ${c}`).join('\n')}

## Workflow

${workflow}

## Output Format

${outputFormat}
`;

  return template;
}

/**
 * Generates a hook template
 * @param {object} params - Hook parameters
 * @returns {string} Hook JSON content
 */
export function generateHookJson({ name, description, events, conditions, action }) {
  return JSON.stringify({
    name,
    description,
    events,
    conditions,
    action
  }, null, 2);
}

/**
 * Generates a skill template
 * @param {object} params - Skill parameters
 * @returns {string} Skill markdown content
 */
export function generateSkillTemplate({ name, description, commands, agents, usage }) {
  let template = `# ${name}

${description}

## Available Commands

${commands.map(c => `- \`/${c.name}\`: ${c.description}`).join('\n')}

## Available Agents

${agents.map(a => `- \`@${a.name}\`: ${a.description}`).join('\n')}

## Usage

${usage}
`;

  return template;
}

export default {
  generateReadmeTemplate,
  generateCommandTemplate,
  generateAgentTemplate,
  generateHookJson,
  generateSkillTemplate
};