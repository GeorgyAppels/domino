export default function Dices({dices, message, showDices}) {
    return (
        <div>
            <p><b>{message} </b>{showDices(dices)}</p>
        </div>    
    )
}