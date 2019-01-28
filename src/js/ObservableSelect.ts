import { BehaviorSubject } from 'rxjs';
import { select, Selection } from 'd3-selection';

export class ObservableSelect extends BehaviorSubject<string> {
    protected _selection: Selection<HTMLSelectElement, any, any, any>;
    constructor(protected name: string, value: string, options: Array<string>) {
        super(value);
        this._selection = select<HTMLSelectElement, any>(`select[name=${this.name}]`);
        // initialize options before setting value, otherwise it gets reset to the first existing option.
        this.options(options);
        this._selection.property('value', value);
        this._selection.on('change', () => {
            super.next(<string>this._selection.property('value'));
        });
    }
    public options(options: Array<string>) {
        const optionElements = this._selection.selectAll('option').data(options, function (d: any) { return d; });
        optionElements.enter().append('option').attr('value', (d: any) => d).text((d: any) => d);
        // use object itself as key to identify which entities to remove.
        optionElements.exit().filter(function (d: any) { return d; }).remove();
    }
}
