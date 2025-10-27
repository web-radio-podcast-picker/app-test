/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

// app globals

const Flag_Raspberry = 'raspberry'
const Flag_Kiosk = 'kiosk'
const Flag_NoSwype = 'noswype'
const Flag_SmallDisp = 'smldisp'
const Flag_App = 'app'
const Flag_NoViz = 'noviz'
const Flag_IPhone = 'ipho'

const AudioContext = window.AudioContext || window.webkitAudioContext
window.requestAnimationFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();

// radios lists
const RadioList = 'rad'

// in 'lists' pane
const RadioList_History = 'History'
const RadioList_List_VisibleName = '- History -'

// out of 'lists' pane
const RadioList_List = 'List'
const RadioList_All = 'All'
const RadioList_Art = 'Art'
const RadioList_Lang = 'Lang'
const RadioList_Tag = 'Tag'

const RadioList_Podcast = 'Podcast'

// pseudo lists
const RadioList_Info = 'Info'
const RadioList_Viz = 'Viz'

// sources ids
const Source_Id_AudioInput = 'Audio Input'
const Source_Id_Media = 'Media'
const Source_Id_None = 'None'

// devices ids
const Device_Id_Default = 'default'
const Device_Id_Communications = 'communications'

// devices kinds ids
const Device_Kind_Id_Audio_Input = 'audioinput'
const Device_Kind_Id_Video_Input = 'videoinput'
const Device_Kind_Id_Audio_Output = 'audiooutput'

const ScrollIntoViewProps = {
    behavior: 'instant',
    block: 'center',
    inline: 'center'
}

// kbd tags
const Kbd_Op = 'op'
const Kbd_Num = 'num'
const Kbd_Dot = 'dot'
const Kbd_Ch = 'ch'

// popups align
const Align_Center_Middle_Top = 'center-middle-top'
const Align_Center_Top = 'center-top'

// math ops
const Math_Ops = {
    '✕': 'x',
    '+': '+',
    '-': '-',
    '/': '/',
    '.': '.'
}

// units
const Units_Kilos = [null, null, null, '', 'K', 'M', 'G']
const Units_Bytes = [null, null, null, 'b', 'Kb', 'Mb', 'Gb']
const Units_Frequencies = [null, null, null, 'Hz', 'kHz', 'mHz', 'gHz']
const Units_Volts = ['nV', 'µV', 'mV', 'V', 'kV', 'mgV', 'gV']
const Units_Volts_Steps = [
    1 / 1000000000,
    1 / 1000000,
    [1 / 10, 100.0],
    1,
    1000,
    1000000,
    1000000000
]

// view layouts
const Half_Bottom = 'half bottom'
const Half_Top = 'half top'
const Full = 'full'

// screen
const Screen_Orientation_Portrait = 'portrait'
const Screen_Orientation_Landscape = 'landscape'

// ui

const Class_Icon_Disabled = 'but-icon-disabled'
const Class_Item_Selected = 'item-selected'

const Class_Hidden = 'hidden'
