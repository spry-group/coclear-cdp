import { select }  from 'd3-selection';
import { EventEmitter } from "events";

export class Select extends EventEmitter {
    protected selection: any;

    constructor(name: string) {
        super()
        this.selection = select<HTMLElement, any>(`input[name=${name}]`);
        // refire change events
        this.selection.on('change', () => { this.emit('change', name, this.selection.property('value')); });
    }

    setOptions(options: any) {
        // use object itself as key to identify data.
        var optionElements = this.selection.selectAll('option').data(options, function(d:any) { return d;});
        optionElements.enter().append('option').attr('value', (d:any) => d).text((d:any) => d);
        // use object itself as key to identify which entities to remove.
        optionElements.exit().filter(function(d:any) { return d }).remove();
    }

    setValue(value: any) {
        this.selection.property('value', value);
    }
}