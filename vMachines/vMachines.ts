export class vMachines
{
    public Player: PlayerMp = mp.players.local;
    public IsUsingVendingMachine: boolean = false;

    private VMANIM: vMachinesAnim = new vMachinesAnim(this);

    private VendingMachineHashes =
    [
        mp.game.gameplay.getHashKey("prop_vend_coffe_01"), 
        mp.game.gameplay.getHashKey("prop_vend_snak_01"),
        mp.game.gameplay.getHashKey("prop_vend_snak_01_tu"),
        mp.game.gameplay.getHashKey("prop_vend_soda_01"),
        mp.game.gameplay.getHashKey("prop_vend_soda_02"),
        mp.game.gameplay.getHashKey("prop_vend_water_01")
    ];

    public IsNearVendingMachine() : boolean
    {
        return this.GetNearestVendingMachineToPlayer() != -1;
    }

    public GetOffsetWorldCoordinateForVendingMachine(handle: number) : Vector3Mp
    {
        if(handle === -1)
            return new mp.Vector3(-1, -1, -1);

        return mp.objects.atHandle(handle).getOffsetFromGivenWorldCoords(0, -1, 0.1);
    }

    public GetNearestVendingMachineToPlayer() : number
    {
        for(let hash of this.VendingMachineHashes)
        {
            var handle = mp.game.object.getClosestObjectOfType(this.Player.position.x, this.Player.position.y, this.Player.position.z, 1.0, hash, false, false, false);

            if(mp.game.entity.isAnEntity(handle))
                return handle;
        }
        return -1;
    }

    public TriggerVendingMachine() : boolean
    {
        let handle = this.GetNearestVendingMachineToPlayer();
        let coordinates = this.GetOffsetWorldCoordinateForVendingMachine(handle);

        if(this.IsUsingVendingMachine || handle === -1 || (coordinates.x === -1 && coordinates.y === -1 && coordinates.z === -1) || this.IsVendingMachineInUse(handle))
            return false;
        
        this.Player.setVariable('IsUsingVendingMachine', handle);
        this.Player.setStealthMovement(false, "DEFAULT_ACTION");
        this.Player.taskLookAt(handle, 2000, 2048, 3);
        this.Player.setResetFlag(322, true);
        this.Player.taskGoStraightToCoord(coordinates.x, coordinates.y, coordinates.z, 1.0, 20000, mp.objects.atHandle(handle).getHeading(), 0.1);

        while(this.Player.getScriptTaskStatus(2106541073) != 7 && !this.Player.isAtCoord(coordinates.x, coordinates.z, coordinates.y, 0.1, 0, 0, false, true, 0))
            mp.game.wait(0);
    
        this.VMANIM.BeginAnimation();
        return true;
    }

    public InteractionCheck()
    {
        if( mp.game.controls.isControlJustPressed(vMachinesConst.INPUT_GROUP_ALL, vMachinesConst.CONTROL_CONTEXT) 
            && !this.IsUsingVendingMachine 
            && this.IsNearVendingMachine() 
            && !this.IsVendingMachineInUse(this.GetNearestVendingMachineToPlayer()))
        {
            this.SetVendingMachineUseState(true);
        }
        if( mp.game.controls.isControlJustPressed(vMachinesConst.INPUT_GROUP_ALL, vMachinesConst.CONTROL_FRONTENDCANCEL)
            && this.IsUsingVendingMachine)
        {
            this.SetVendingMachineUseState(false);            
        }
    }

    public SetVendingMachineUseState(State: boolean)
    {
        if(State && this.TriggerVendingMachine())
            this.IsUsingVendingMachine = State;
        else
        {
            this.Player.clearTasksImmediately();
            this.Player.setVariable('IsUsingVendingMachine', null);
            this.IsUsingVendingMachine = State;
        }
    }

    public IsVendingMachineInUse(handle: number) : boolean
    {
        return mp.players.streamed.some(p => p.getVariable('IsUsingVendingMachine') === handle);
    }

    public Update(nametags: any) 
    {
        try
        {
        if(!this.IsUsingVendingMachine)
        {
            if(this.IsNearVendingMachine())
                vMachinesUI.Show();
            this.InteractionCheck();
        }
        this.VMANIM.UpdateAnimation();
        }
        catch(e)
        {
            mp.game.graphics.drawText(e, [0.5, 0.005], { font: 4, color: [255,255,255,255], scale: [1.0, 1.0], outline: true});
        }
    }

    public constructor() 
    {
        mp.events.add('render', this.Update);
    }
}

class vMachinesConst
{
    public static readonly ANIMATION_DICTIONARY_STRING = "MINI@SPRUNK@FIRST_PERSON";
    public static readonly ANIMATION_BUY_DRINK_PART1 = "PLYR_BUY_DRINK_PT1";
    public static readonly ANIMATION_BUY_DRINK_PART2 = "PLYR_BUY_DRINK_PT2";
    public static readonly ANIMATION_BUY_DRINK_PART3 = "PLYR_BUY_DRINK_PT3";
    public static readonly AUDIO_BANK_VENDING_MACHINE = "VENDING_MACHINE";
    public static readonly SET_PED_FAST_ANIMATIONS = '0x2208438012482A1A';
    public static readonly INPUT_GROUP_ALL = 2;
    public static readonly CONTROL_CONTEXT = 51;
    public static readonly CONTROL_FRONTENDCANCEL = 202;
}

class vMachinesAnim
{
    Machines: vMachines;
    IsAnimDictLoaded: boolean = false;

    public constructor(Machines: vMachines)
    {
        this.Machines = Machines;
    }

   public BeginAnimation()
   {
        mp.game.streaming.requestAnimDict(vMachinesConst.ANIMATION_DICTIONARY_STRING);
        mp.game.audio.requestAmbientAudioBank(vMachinesConst.AUDIO_BANK_VENDING_MACHINE, false);

        while((this.IsAnimDictLoaded = mp.game.streaming.hasAnimDictLoaded(vMachinesConst.ANIMATION_DICTIONARY_STRING)) === false)
            mp.game.wait(0);

        this.Machines.Player.taskPlayAnim(vMachinesConst.ANIMATION_DICTIONARY_STRING, vMachinesConst.ANIMATION_BUY_DRINK_PART1, 2, -4, -1, 1048576, 0, false, false, false);
   } 

   public UpdateAnimation()
   {
        if(!this.IsAnimDictLoaded)
            return;
        
        if(this.Machines.Player.isPlayingAnim(vMachinesConst.ANIMATION_DICTIONARY_STRING, vMachinesConst.ANIMATION_BUY_DRINK_PART1, 1))
        {
            if(this.Machines.Player.getAnimCurrentTime(vMachinesConst.ANIMATION_DICTIONARY_STRING, vMachinesConst.ANIMATION_BUY_DRINK_PART1) > 0.1)
                vMachinesObjects.AttachObject("ng_proc_sodacan_01a");
            
            if(this.Machines.Player.getAnimCurrentTime(vMachinesConst.ANIMATION_DICTIONARY_STRING, vMachinesConst.ANIMATION_BUY_DRINK_PART1) > 0.95)
            {
                this.Machines.Player.taskPlayAnim(vMachinesConst.ANIMATION_DICTIONARY_STRING, vMachinesConst.ANIMATION_BUY_DRINK_PART2, 4, -1000, -1, 1048576, 0, false, false, false);
                mp.game.invoke(vMachinesConst.SET_PED_FAST_ANIMATIONS, this.Machines.Player.handle, false, false);
            }
        }

        if(this.Machines.Player.isPlayingAnim(vMachinesConst.ANIMATION_DICTIONARY_STRING, vMachinesConst.ANIMATION_BUY_DRINK_PART2, 1))
        {
            if(this.Machines.Player.getAnimCurrentTime(vMachinesConst.ANIMATION_DICTIONARY_STRING, vMachinesConst.ANIMATION_BUY_DRINK_PART2) > 0.95)
            {
                this.Machines.Player.taskPlayAnim(vMachinesConst.ANIMATION_DICTIONARY_STRING, vMachinesConst.ANIMATION_BUY_DRINK_PART3, 1000, -4, -1, 1048624, 0, false, false, false);
                mp.game.invoke(vMachinesConst.SET_PED_FAST_ANIMATIONS, this.Machines.Player.handle, false, false);
            }
        }

        if(this.Machines.Player.isPlayingAnim(vMachinesConst.ANIMATION_DICTIONARY_STRING, vMachinesConst.ANIMATION_BUY_DRINK_PART3, 1))
        {
            if(this.Machines.Player.getAnimCurrentTime(vMachinesConst.ANIMATION_DICTIONARY_STRING, vMachinesConst.ANIMATION_BUY_DRINK_PART3) > 0.1)
                vMachinesObjects.DetachObject("ng_proc_sodacan_01a");

            if(this.Machines.Player.getAnimCurrentTime(vMachinesConst.ANIMATION_DICTIONARY_STRING, vMachinesConst.ANIMATION_BUY_DRINK_PART3) > 0.95)
                this.EndAnimation();
        }
   }

   public EndAnimation()
   {
        mp.game.streaming.removeAnimDict(vMachinesConst.ANIMATION_DICTIONARY_STRING);
        mp.game.audio.releasedNamedScriptAudioBank(vMachinesConst.AUDIO_BANK_VENDING_MACHINE);

        this.Machines.SetVendingMachineUseState(false);
        mp.events.callRemote('vendingMachines.Remote.Finish');    
   }
}

class vMachinesUI
{
    private static readonly INTERACT_HELP_TEXT: string = "~h~Drücke ~g~ ~INPUT_CONTEXT~ ~s~ um etwas zu Kaufen!";

    public static Show()
    {
        var Text = this.INTERACT_HELP_TEXT;
        mp.game.ui.setTextComponentFormat("STRING");
        mp.game.ui.addTextComponentSubstringPlayerName(Text);
        mp.game.ui.displayHelpTextFromStringLabel(0, true, true, -1);
    }
}

class vMachinesObjects
{
    public static AttachObject(objectName: string)
    {

    }

    public static DetachObject(objectName: string)
    {

    }
}

let VendingMachine = new vMachines();