const textHandler = (data) => {
    let x, y;
    let time, location, card, amount, currencySymbol;

    for (let i = 0; i < data.length; i++) {
        const content = data[i].content.trim();

        if (content.startsWith('状态') || content.startsWith('Status')) {
            x = i;
        } else if (content.startsWith('累计') || content.startsWith('Total')) {
            y = i;

            // Find the amount after "Total"
            for (let j = y + 1; j < data.length; j++) {
                const amountContent = data[j].content.trim();
                const amountMatch = amountContent.match(/([^\d]*)(\d+\.\d+)/);
                if (amountMatch) {
                    currencySymbol = amountMatch[1].trim();
                    amount = amountMatch[2];
                    break;
                }
            }

            if (!amount || !currencySymbol) {
                throw new Error('Invalid data format: Amount or currency symbol is missing');
            }

            break;
        }
    }

    if (x === undefined || y === undefined) {
        throw new Error('Invalid data format: Missing required fields');
    }

    if (x - 1 < 0 || x + 1 >= data.length) {
        throw new Error('Invalid data format: Required indices are out of range');
    }

    time = data[x - 1].content.trim();
    if (time.includes('GMT')) {
        if (x - 3 < 0) {
            throw new Error('Invalid data format: Required index for location is out of range');
        }
        location = data[x - 3].content.trim();
    } else {
        if (x - 2 < 0) {
            throw new Error('Invalid data format: Required index for location is out of range');
        }
        location = data[x - 2].content.trim();
    }

    card = data[x + 1].content.trim();

    return { amount, time, location, card, currencySymbol };
};

module.exports = (req, res) => {
    if (!req.body) {
        res.status(400).send({ error: 'Request body is missing' });
        return;
    }

    const text = req.body.text;
    if (!text) {
        res.status(400).send({ error: 'Text is missing in the request body' });
        return;
    }

    const lines = text.split('\n');

    const output = lines.map((line, index) => {
        return { index, content: line };
    });

    let result;
    try {
        result = textHandler(output);
    } catch (error) {
        res.status(400).send({ error: error.toString() });
        return;
    }

    res.status(200).send(result);
};
