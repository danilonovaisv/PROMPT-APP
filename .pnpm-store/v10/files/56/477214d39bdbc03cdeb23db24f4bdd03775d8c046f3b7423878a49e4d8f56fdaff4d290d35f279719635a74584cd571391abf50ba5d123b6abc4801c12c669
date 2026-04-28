export const createSwitchCommand = (program) => program
    .command('switch')
    .description('Switch your active Netlify account')
    .option('--email <email>', 'Switch to the account matching this email address')
    .action(async (options, command) => {
    const { switchCommand } = await import('./switch.js');
    await switchCommand(options, command);
});
//# sourceMappingURL=index.js.map