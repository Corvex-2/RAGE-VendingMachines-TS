const scripts = [
    "vMachines/vMachines"
];

scripts.forEach((file) =>
{
    try
    {
        require(file);
    }
    catch(e)
    {
        mp.gui.chat.push('Failed to load Script "${file}".')
    }
});
