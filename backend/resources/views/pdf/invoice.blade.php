<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ $templateData['document_number'] ?: $invoice->invoice_number }}</title>
    <style>
        @page {
            margin: 30mm 12mm 30mm;
        }

        :root {
            --amount-gap-width: 136px;
            --amount-box-width: 136px;
        }

        * {
            box-sizing: border-box;
            font-family: DejaVu Sans, sans-serif;
        }

        body {
            color: #101010;
            font-size: 9.6px;
            line-height: 1.22;
            margin: 0;
        }

        .sheet {
            position: relative;
        }

        .page-header,
        .page-footer {
            left: 0;
            position: fixed;
            right: 0;
            z-index: 1;
        }

        .page-header {
            top: -21mm;
            height: 22mm;
        }

        .page-footer {
            bottom: -16mm;
            height: 15mm;
        }

        .header-frame,
        .footer-frame {
            height: 100%;
            overflow: hidden;
            width: 100%;
        }

        .header-frame img,
        .footer-frame img {
            display: block;
            height: 100%;
            width: 100%;
            object-fit: contain;
        }

        .header-frame img {
            object-position: center top;
        }

        .footer-frame img {
            object-position: center bottom;
        }

        .watermark {
            color: rgba(22, 163, 74, 0.12);
            font-size: 94px;
            font-weight: 700;
            left: 19%;
            position: fixed;
            text-transform: uppercase;
            top: 42%;
            transform: rotate(-30deg);
            z-index: 0;
        }

        .content {
            position: relative;
            z-index: 2;
        }

        .main-flow {
            padding-bottom: 0;
        }

        .title {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: 0.4px;
            margin: 0 0 16px;
            text-align: center;
        }

        .top-table,
        .meta-table,
        .items-table,
        .amount-table,
        .summary-table,
        .summary-box-inner,
        .payment-table,
        .footer-table {
            border-collapse: collapse;
            width: 100%;
        }

        .top-table,
        .summary-table,
        .summary-box-inner,
        .summary-total-box table,
        .amount-table {
            table-layout: fixed;
        }

        .top-table td,
        .footer-table td {
            vertical-align: top;
        }

        .left-col {
            padding-right: 14px;
            width: 50%;
        }

        .right-col {
            padding-left: 14px;
            width: 50%;
        }

        .section-title {
            border-bottom: 2px solid #111111;
            font-size: 11.5px;
            font-weight: 700;
            margin: 0;
            padding-bottom: 5px;
        }

        .company-block {
            page-break-inside: avoid;
            padding-top: 10px;
        }

        .party-content {
            min-height: 92px;
        }

        .party-extra {
            min-height: 14px;
        }

        .company-name {
            font-size: 10.8px;
            font-weight: 700;
            margin: 0 0 6px;
        }

        .company-address {
            font-size: 9.8px;
            line-height: 1.38;
            margin: 0;
            text-align: justify;
            text-justify: inter-word;
            white-space: normal;
            word-break: normal;
        }

        .npwp {
            margin-top: 8px;
        }

        .meta-box {
            background: #d9d9d9;
            margin-left: auto;
            margin-top: 10px;
            padding: 9px 12px;
            width: 92%;
        }

        .meta-table td {
            border: 0;
            font-size: 9.8px;
            font-weight: 700;
            padding: 2px 0;
            vertical-align: top;
        }

        .meta-label {
            width: 33%;
        }

        .meta-colon {
            width: 12px;
        }

        .meta-value {
            text-align: left;
            white-space: nowrap;
        }

        .meta-value-document {
            font-size: 9.4px;
            letter-spacing: -0.1px;
        }

        .items-table {
            margin-top: 18px;
            page-break-inside: avoid;
        }

        .items-table th {
            background: #111111;
            border-top: 0;
            border-left: 0;
            border-right: 0;
            border-bottom: 1px solid #111111;
            color: #ffffff;
            font-size: 9.8px;
            font-weight: 700;
            padding: 6px 10px;
            text-align: center;
        }

        .amount-gap-heading {
            border: 0 !important;
            width: var(--amount-gap-width);
        }

        .amount-heading {
            border-left: 0 !important;
            padding-left: 0;
            text-align: center;
            width: var(--amount-box-width);
        }

        .items-table td {
            border: 1px solid #111111;
            font-size: 9.8px;
            padding: 8px 10px;
            vertical-align: middle;
        }

        .item-description {
            font-weight: 700;
        }

        .item-description-cell {
            border-right: 0 !important;
        }

        .amount-gap-cell {
            border-left: 0 !important;
            border-right: 0 !important;
            border-top: 1px solid #111111 !important;
            border-bottom: 1px solid #111111 !important;
            padding: 0 !important;
            width: var(--amount-gap-width);
        }

        .amount-cell {
            border-left: 1px solid #111111 !important;
            border-right: 1px solid #111111 !important;
            padding: 0;
            width: var(--amount-box-width);
        }

        .amount-gap-col {
            width: var(--amount-gap-width);
        }

        .amount-box-col {
            width: var(--amount-box-width);
        }

        .amount-table td {
            border: 0;
            font-size: 9.4px;
            font-weight: 400;
            padding: 5px 12px;
            vertical-align: middle;
            white-space: nowrap;
        }

        .currency {
            font-variant-numeric: tabular-nums;
            text-align: left;
            white-space: nowrap;
            width: 60px;
        }

        .value-right {
            font-variant-numeric: tabular-nums;
            text-align: right;
            width: 100%;
        }

        .summary-wrap {
            margin-top: 18px;
            page-break-inside: avoid;
        }

        .summary-inner {
            margin-left: auto;
            width: 316px;
        }

        .summary-table td {
            padding: 0;
            vertical-align: middle;
        }

        .summary-label {
            font-size: 9.8px;
            font-weight: 800;
            padding: 6px 26px 6px 0;
            text-align: right;
            white-space: nowrap;
            width: 126px;
        }

        .summary-box {
            border-left: 1px solid #111111;
            border-right: 1px solid #111111;
            width: 190px;
        }

        .summary-row-first .summary-box {
            border-top: 1px solid #111111;
        }

        .summary-row-middle .summary-box,
        .summary-row-last .summary-box {
            border-top: 1px dashed #111111;
        }

        .summary-row-last .summary-box {
            border-bottom: 1px solid #111111;
        }

        .summary-box-inner td {
            border: 0;
            font-size: 9.4px;
            font-weight: 400;
            padding: 5px 12px;
            white-space: nowrap;
        }

        .summary-box-inner .currency,
        .summary-total-box .currency,
        .amount-table .currency {
            padding-left: 14px;
            text-align: left;
            width: 60px;
        }

        .summary-box-inner .value-right,
        .summary-total-box .value-right,
        .amount-table .value-right {
            padding-right: 14px;
            text-align: right;
        }

        .summary-total-wrap {
            margin-top: 16px;
            page-break-inside: avoid;
        }

        .summary-total-inner {
            margin-left: auto;
            width: 316px;
        }

        .summary-total-table {
            border-collapse: collapse;
            table-layout: fixed;
            width: 100%;
        }

        .summary-total-table td {
            padding: 0;
            vertical-align: middle;
        }

        .summary-total-label {
            font-size: 10px;
            font-weight: 700;
            padding: 0 26px 0 0;
            text-align: right;
            white-space: nowrap;
            width: 126px;
        }

        .summary-total-box {
            background: #111111;
            width: 190px;
        }

        .summary-total-box table {
            border-collapse: collapse;
            width: 100%;
        }

        .summary-total-box td {
            border: 0;
            color: #ffffff;
            font-size: 9.8px;
            font-weight: 700;
            padding: 6px 12px;
            white-space: nowrap;
        }

        .bottom-panel {
            margin-top: 44px;
            page-break-inside: avoid;
        }

        .footer-table {
            table-layout: fixed;
            width: 100%;
            border-collapse: collapse;
        }

        .payment-column {
            text-align: left;
            vertical-align: top;
            width: 58%;
        }

        .payment-box {
            display: inline-block;
            background: #d9e8f8;
            max-width: 100%;
            min-width: 380px;
            padding: 12px 22px 10px 22px;
        }

        .payment-title {
            font-size: 9.8px;
            font-weight: 700;
            margin: 0 0 8px;
            text-decoration: underline;
        }

        .payment-table td {
            border: 0;
            font-size: 9.6px;
            padding: 2px 0;
            vertical-align: top;
        }

        .payment-label {
            font-weight: 700;
            white-space: nowrap;
            width: 58%;
        }

        .payment-colon {
            width: 16px;
        }

        .signature-column {
            padding-left: 0;
            text-align: right;
            vertical-align: top;
            width: 42%;
        }

        .signature-wrap {
            display: inline-block;
            min-width: 210px;
            width: 210px;
            margin-right: 0;
            text-align: center;
        }

        .signature-date {
            font-size: 10.8px;
            font-weight: 700;
            margin: 0 0 126px;
        }

        .signature-name {
            font-size: 10px;
            font-weight: 400;
            margin: 0;
            text-decoration: underline;
        }

        .signature-role {
            font-size: 9.6px;
            font-weight: 400;
            margin: 5px 0 0;
        }

    </style>
</head>
<body>
    @if($invoice->status === \App\Models\Invoice::STATUS_PAID)
        <div class="watermark">LUNAS</div>
    @endif

    @php
        $documentNumber = $templateData['document_number'] ?: $invoice->invoice_number;
        $issueDate = \Illuminate\Support\Carbon::parse($invoice->issue_date)->format('d/m/Y');
        $signatureDate = \Illuminate\Support\Carbon::parse($templateData['signature_date'])->format('d/m/Y');
        $signatureLine = trim(($templateData['signature_city'] ?: 'Jakarta').', '.$signatureDate);
        $taxAmount = (float) round($invoice->tax_amount);
        $deductionLabel = $templateData['deduction_label'] ?: 'Potongan';
        $formatAddress = static function (?string $address): string {
            $normalized = trim((string) $address);

            if ($normalized === '') {
                return '-';
            }

            $normalized = preg_replace('/\s+/u', ' ', str_replace(["\r\n", "\r", "\n"], ' ', $normalized)) ?? '';
            $normalized = preg_replace('/\s*,\s*/u', ', ', $normalized) ?? $normalized;

            return $normalized !== '' ? $normalized : '-';
        };
        $issuerAddress = $formatAddress($templateData['issuer_address']);
        $recipientAddress = $formatAddress($templateData['recipient_address']);
    @endphp

    <div class="sheet">
        <div class="page-header">
            <div class="header-frame">
                @if(!empty($templateData['header_image_data_uri']))
                    <img src="{{ $templateData['header_image_data_uri'] }}" alt="Kop surat">
                @endif
            </div>
        </div>

        <div class="page-footer">
            <div class="footer-frame">
                @if(!empty($templateData['footer_image_data_uri']))
                    <img src="{{ $templateData['footer_image_data_uri'] }}" alt="Footer surat">
                @endif
            </div>
        </div>

        <div class="content">
            <div class="main-flow">
                <h1 class="title">INVOICE</h1>

                <table class="top-table">
                    <tr>
                        <td class="left-col">
                            <p class="section-title">Company Information</p>
                            <div class="company-block">
                                <div class="party-content">
                                    <p class="company-name">{{ $templateData['issuer_company_name'] }}</p>
                                    <p class="company-address">{{ $issuerAddress }}</p>
                                </div>
                                <div class="party-extra">&nbsp;</div>
                            </div>
                        </td>
                        <td class="right-col">
                            <p class="section-title">Bill To</p>
                            <div class="company-block">
                                <div class="party-content">
                                    <p class="company-name">{{ $templateData['recipient_company_name'] }}</p>
                                    <p class="company-address">{{ $recipientAddress }}</p>
                                </div>
                                <p class="company-address npwp party-extra">NPWP : {{ $templateData['recipient_npwp'] ?: '-' }}</p>
                            </div>

                            <div class="meta-box">
                                <table class="meta-table">
                                    <tr>
                                        <td class="meta-label">No. Invoice</td>
                                        <td class="meta-colon">:</td>
                                        <td class="meta-value meta-value-document">{{ $documentNumber }}</td>
                                    </tr>
                                    <tr>
                                        <td class="meta-label">Invoice Date</td>
                                        <td class="meta-colon">:</td>
                                        <td class="meta-value">{{ $issueDate }}</td>
                                    </tr>
                                    <tr>
                                        <td class="meta-label">Contract No.</td>
                                        <td class="meta-colon">:</td>
                                        <td class="meta-value">{{ $templateData['contract_number'] ?: '-' }}</td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                    </tr>
                </table>

                <table class="items-table">
                    <colgroup>
                        <col>
                        <col class="amount-gap-col">
                        <col class="amount-box-col">
                    </colgroup>
                    <thead>
                        <tr>
                            <th>Item Description</th>
                            <th class="amount-gap-heading"></th>
                            <th class="amount-heading">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($invoice->items as $item)
                            <tr>
                                <td class="item-description item-description-cell">{{ $item->description }}</td>
                                <td class="amount-gap-cell"></td>
                                <td class="amount-cell">
                                    <table class="amount-table">
                                        <tr>
                                            <td class="currency"><b>Rp</b></td>
                                            <td class="value-right"><b>{{ number_format((float) round($item->total), 0, ',', '.') }}</b></td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>

                <div class="summary-wrap">
                    <div class="summary-inner">
                        <table class="summary-table">
                            <tr class="summary-row-first">
                                <td class="summary-label"><b>Subtotal</b>&nbsp;</td>
                                <td class="summary-box">
                                    <table class="summary-box-inner">
                                        <tr>
                                            <td class="currency"><b>Rp</b></td>
                                            <td class="value-right"><b>{{ number_format((float) round($invoice->subtotal), 0, ',', '.') }}</b></td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr class="summary-row-middle">
                                <td class="summary-label">PPN {{ rtrim(rtrim(number_format((float) $invoice->tax_percent, 2, '.', ''), '0'), '.') }}%&nbsp;</td>
                                <td class="summary-box">
                                    <table class="summary-box-inner">
                                        <tr>
                                            <td class="currency">Rp</td>
                                            <td class="value-right">{{ number_format($taxAmount, 0, ',', '.') }}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr class="summary-row-last">
                                <td class="summary-label">{{ $deductionLabel }}&nbsp;</td>
                                <td class="summary-box">
                                    <table class="summary-box-inner">
                                        <tr>
                                            <td class="currency">-Rp</td>
                                            <td class="value-right">{{ number_format((float) round($invoice->deduction_amount), 0, ',', '.') }}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>

                <div class="summary-total-wrap">
                    <div class="summary-total-inner">
                        <table class="summary-total-table">
                            <tr>
                                <td class="summary-total-label">Total&nbsp;</td>
                                <td class="summary-total-box">
                                    <table>
                                        <tr>
                                            <td class="currency">Rp</td>
                                            <td class="value-right">{{ number_format((float) round($invoice->total), 0, ',', '.') }}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>

            <div class="bottom-panel">
                <table class="footer-table">
                    <tr>
                        <td class="payment-column">
                            <div class="payment-box">
                                <p class="payment-title">Payment :</p>
                                <table class="payment-table">
                                    <tr>
                                        <td class="payment-label">Bank Name</td>
                                        <td class="payment-colon">:</td>
                                        <td>{{ $templateData['payment_bank_name'] }}</td>
                                    </tr>
                                    <tr>
                                        <td class="payment-label">Bank Account Number</td>
                                        <td class="payment-colon">:</td>
                                        <td>{{ $templateData['payment_account_number'] }}</td>
                                    </tr>
                                    <tr>
                                        <td class="payment-label">Account Holder</td>
                                        <td class="payment-colon">:</td>
                                        <td>{{ $templateData['payment_account_holder'] }}</td>
                                    </tr>
                                </table>
                            </div>
                        </td>
                        <td class="signature-column">
                            <div class="signature-wrap">
                                <p class="signature-date">{{ $signatureLine }}</p>
                                <p class="signature-name">({{ $templateData['signature_name'] }})</p>
                                <p class="signature-role">{{ $templateData['signature_role'] }}</p>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
</body>
</html>
