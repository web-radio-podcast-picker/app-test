/*
    Web Radio Podcast Picker
    Copyright(C) 2025  Franck Gaspoz
    find license and copyright informations in files /COPYRIGHT and /LICENCE
*/

class InputWidgets {

    $inputWidget = null           // input widget if any
    inputWidgetControlId = null   // input widget binded edited control id if any

    closeInputWidget() {
        if (this.$inputWidget != null) {
            this.close(
                this.$inputWidget,
                this.inputWidgetControlId)
        }
    }

    close(
        $inputWidget,
        inputWidgetControlId) {
        // must bkp inputs props
        const binding = ui.bindings.getBinding(inputWidgetControlId)
        binding.props_bkp = deepClone(binding.props)
        // remove & destroy controls
        $inputWidget.remove()
        this.$inputWidget = this.inputWidgetControlId = null
    }

    openInputWidget(controlId, opts) {
        const t = this
        this.closeInputWidget()
        const $c = $('#' + controlId)
        const $w = $('#input_widget').clone()
        const $cnt = $w.find('#iw_vpane')
        this.inputWidgetControlId = controlId
        const binding = ui.bindings.getBinding(controlId)
        const props = binding.props
        binding.props_bkp = deepClone(binding.props)
        props.input.iniDelta = props.input.delta

        // input,unit,label

        const $i = $c.clone()
        $i.attr('id', null)
        $i.css('width', props.digits / 1.5 + 'em')
        $i.css('grid-column', 1)
        $i.css('grid-row', 1)
        var nxCol = 2

        const $p = $c.parent()
        const pid = $p.attr('id')
        const hasUnit = pid == null || !pid.startsWith('opts_')
        if (hasUnit) {
            const $u = $p.find('.unit').clone()
            $u.addClass('unit-big')
            $u.css('grid-column', nxCol)
            $u.css('grid-row', 1)
            nxCol++
            $u.attr('id', null)
            $cnt.prepend($u)
        }
        $cnt.prepend($i)

        // buttons ok,cancel

        const validate = (close) => {
            const val = $i.val()
            ui.bindings.updateBindingSourceAndTarget(controlId, val)
            binding.props.input.value = val
            if (close == null || close == true)
                t.closeInputWidget()
        }

        const $butOk = $w.find('#btn_valid_ok')
        const $butCancel = $w.find('#btn_valid_cancel')
        $butOk.on('click', () => {
            validate()
            binding.props.input.value = $i.val()
        })
        $butCancel.on('click', () => {
            binding.props = deepClone(binding.props_bkp)
            $i.val(binding.props.input.value)
            $inDel.val(binding.props.input.delta)
            validate(false)
            t.closeInputWidget()
        })
        $butOk.attr('id', null)
        $butCancel.attr('id', null)

        // buttons +,-

        const checkRange = (nv) => {
            return (props.input.min == null || nv > props.input.min)
                && (props.input.max == null || nv < props.input.max)
        }

        const getInpVal = () => {
            const $val = $i.val()
            var v = parseFloat($val)
            v = vround(v)
            return v
        }

        const incDecValue = (sign) => {
            var v = getInpVal()

            var nv = v + sign * props.input.delta
            nv = vround(nv)
            nv = parseFloat(nv)

            if (checkRange(nv)) {
                $i.val(nv)
                validate(false)
            }
        }

        const $butPlus = $w.find('#btn_input_plus')
        const $butMinus = $w.find('#btn_input_minus')
        $butPlus.on('click', () => {
            incDecValue(1)
        })
        $butMinus.on('click', () => {
            incDecValue(-1)
        })

        // input

        const validateOrRestore = () => {
            const v = getInpVal()
            const chk = !checkRange(v)
            if (chk) {
                const iv = $i.attr('data-inival')
                $i.val(iv)
                $i.attr(props.attr, iv)
            }
            return chk
        }

        $i.on('change', () => {
            validateOrRestore()
            validate(false)
        })
        $i.on('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault()
                const chk = validateOrRestore()
                if (!chk)
                    validate()
            }
        })

        // delta input: buttons +,-,*,/

        const $inDel = $w.find('#iw_delta')

        const dIncDecMulDivValue = (sign, factor) => {
            const $val = $inDel.val()
            var nv = parseFloat($val)
            nv += sign * props.input.iniDelta
            nv *= factor
            nv = vround(nv)
            nv = parseFloat(nv)
            if (nv > 0) {
                $inDel.val(nv)
                props.input.delta = nv
                validate(false)
            }
        }

        $inDel.val(props.input.delta)
        const $butDPlus = $w.find('#btn_iw_delta_plus')
        const $butDMinus = $w.find('#btn_iw_delta_minus')
        const $butDMul = $w.find('#btn_iw_delta_mul')
        const $butDDiv = $w.find('#btn_iw_delta_div')

        $butDPlus.on('click', () => {
            dIncDecMulDivValue(1, 1)
        })
        $butDMinus.on('click', () => {
            dIncDecMulDivValue(-1, 1)
        })
        $butDMul.on('click', () => {
            dIncDecMulDivValue(0, 10)
        })
        $butDDiv.on('click', () => {
            dIncDecMulDivValue(0, 0.1)
        })

        // add to dom and place

        $('body').append($w)
        const $controlTarget =
            (opts != null && opts.targetControlId != null) ?
                $('#' + opts.targetControlId) : $c
        var pos = $controlTarget.offset()
        var vs = cui.viewSize()

        const setPos = (pos) => {
            $w.css('left', pos.left)
            $w.css('top', pos.top)
        }
        setPos(pos)
        $w.removeClass('hidden')

        const ww = $w.width()
        const wh = $w.height()
        if (ww + pos.left >= vs.width)
            pos.left = vs.width - ww - settings.ui.menuContainerWidth
        if (wh + pos.top >= vs.height)
            pos.top = vs.height - wh
        setPos(pos)

        $i.focus()
        $i.select()

        this.$inputWidget = $w
    }
}