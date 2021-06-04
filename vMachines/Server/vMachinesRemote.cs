using GTANetworkAPI;

public class vMachnesRemote : Script
{
    //IMPORTANT: THIS EVENT IS REQUIRED! 
    [RemoteEvent("vendingMachine.Remote.SharedData")]
    public void UpdatePlayerData(Player player, string key, object data)
    {
        player.SetSharedData(key, data);
    }

    //This event gets fired once the Animation finished playing. You can for example use it, to give a Player Health etc. 
    [RemoteEvent("vendingMachines.Remote.Finish")]
    public void OnVendingMachineInteractionFinish(Player player)
    {
        var health = (player.Health + 25 < 100 ? player.Health + 25 : 100);
        NAPI.Player.SetPlayerHealth(player, health);
    }
}